"""LLM client built on LangChain wrappers.

- Primary: Groq (`ChatGroq`, llama-3.3-70b-versatile). When a second key
  (`GROQ_API_KEY_2`) is present it is used as automatic failover.
- Fallback: local Ollama (`ChatOllama`, llama3.1:8b) — only used when no
  Groq key is set at all (offline dev/testing).

Exposes a single `chat(messages, tools=None, tool_choice=None)` interface
plus `with_structured_output(...)` passthrough for the router, so callers
never care which backend is active.
"""
from __future__ import annotations

import logging
from typing import Any

import config

log = logging.getLogger(__name__)


class LLMClient:
    """Unified chat + tool-calling client with Groq-first, Ollama fallback."""

    def __init__(self) -> None:
        self.provider = config.llm_provider()
        self.last_error: str | None = None
        self._clients: list[Any] = []
        self._primary: Any = None

        if self.provider == "groq":
            from langchain_groq import ChatGroq

            keys = [config.GROQ_API_KEY]
            if config.GROQ_API_KEY_2:
                keys.append(config.GROQ_API_KEY_2)
            for key in keys:
                try:
                    self._clients.append(
                        ChatGroq(
                            model=config.GROQ_MODEL,
                            api_key=key,
                            temperature=0.2,
                        )
                    )
                except Exception as exc:  # noqa: BLE001
                    log.warning("Groq client init failed: %s", exc)
            if self._clients:
                self._primary = self._clients[0]
            else:
                self.provider = "none"
                self.last_error = "No usable Groq client could be initialized"
        elif self.provider == "ollama":
            from langchain_ollama import ChatOllama

            try:
                self._primary = ChatOllama(
                    model=config.OLLAMA_MODEL,
                    base_url=config.OLLAMA_HOST,
                    temperature=0.2,
                )
                self._clients = [self._primary]
            except Exception as exc:  # noqa: BLE001
                self.provider = "none"
                self.last_error = f"Ollama init failed: {exc}"

    @property
    def available(self) -> bool:
        return self._primary is not None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def chat(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
        tool_choice: str | None = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> dict[str, Any]:
        """Run a chat completion.

        Returns a dict with keys:
          - "content": str (assistant text; "" if a tool call was made)
          - "tool_calls": list of {"name", "arguments" (dict)} (may be empty)
        """
        if not self.available:
            self.last_error = "No LLM backend available (set GROQ_API_KEY)"
            return {"content": "", "tool_calls": []}

        errors: list[str] = []
        for client in self._clients:
            result = self._chat_one(client, messages, tools, tool_choice, temperature, max_tokens)
            if result is not None:
                return result
            errors.append(self.last_error or "unknown error")
        self.last_error = "All LLM backends failed: " + " | ".join(errors)
        return {"content": "", "tool_calls": []}

    def with_structured_output(self, schema: type) -> Any:
        """Passthrough to LangChain's structured-output wrapper."""
        if not self.available:
            return None
        return self._primary.with_structured_output(schema)

    # ------------------------------------------------------------------
    def _chat_one(
        self,
        client: Any,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None,
        tool_choice: str | None,
        temperature: float,
        max_tokens: int,
    ) -> dict[str, Any] | None:
        """Run one completion. Returns None on failure (next key is tried)."""
        try:
            kwargs: dict[str, Any] = {
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if tools:
                kwargs["tools"] = tools
                if tool_choice:
                    kwargs["tool_choice"] = tool_choice
            resp = client.invoke(kwargs)
            message = resp.content
            tool_calls = []
            if isinstance(message, list):
                text_parts = [b.get("text", "") for b in message if isinstance(b, dict)]
                message = "".join(text_parts)
            if hasattr(resp, "tool_calls") and resp.tool_calls:
                for tc in resp.tool_calls:
                    tool_calls.append(
                        {
                            "name": tc.name,
                            "arguments": tc.args if isinstance(tc.args, dict) else {},
                        }
                    )
            return {"content": message or "", "tool_calls": tool_calls}
        except Exception as exc:  # noqa: BLE001
            self.last_error = f"LLM error: {exc}"
            log.warning("LLM chat failed (trying next backend if any): %s", self.last_error)
            return None