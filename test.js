let num = 100;
async function register() {
  try {
    let res = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test${num}@example.com`,
        password: 'password123',
        name: 'Test User',
      }),
    });
    let data = await res.json();

    num++;
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}

setInterval(register, 0);
