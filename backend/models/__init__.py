from .openai_models import OPENAI_MODELS
from .claude_models import CLAUDE_MODELS
from .gemini_models import GEMINI_MODELS
from .openrouter_models import OPENROUTER_MODELS

# Centralized dictionary of all LLM providers and their available models
MODELS = {
    "openai": OPENAI_MODELS,
    "claude": CLAUDE_MODELS,
    "gemini": GEMINI_MODELS,
    "openrouter": OPENROUTER_MODELS,
}
