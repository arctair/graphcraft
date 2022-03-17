def test_upgrade(client):
    mc_path = '/home/arctair/.local/share/multimc/instances/nomifactory-dev-ab57eb2-client/minecraft'
    with open(f'{mc_path}/recipes-v1.json', 'rb') as f:
        response = client.put('/recipes-v1.json', data=f, headers={'Content-Type': 'application/json'})
        assert response.status_code == 204

    response = client.get('/recipes-v2.json')
    assert response.status_code == 200
    with open(f'{mc_path}/recipes-v2.json', 'wb') as f:
        f.write(response.data)
