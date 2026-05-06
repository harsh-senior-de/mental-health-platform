from httpx import AsyncClient


async def test_health_returns_200(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200


async def test_health_body_is_ok(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.json() == {"status": "ok"}
