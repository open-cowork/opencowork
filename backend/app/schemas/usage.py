from pydantic import BaseModel


class UsageResponse(BaseModel):
    """Usage statistics response."""

    total_cost_usd: float | None
    total_input_tokens: int | None
    total_output_tokens: int | None
    total_duration_ms: int | None
