def test_up(client):
    response = client.get("/")
    assert response.status_code == 404

