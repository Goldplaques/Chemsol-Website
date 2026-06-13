// Stripe Payment Integration

const stripe = Stripe(process.env.STRIPE_PUBLIC_KEY || 'pk_test_your_stripe_key');
const elements = stripe.elements();
const cardElement = elements.create('card', {
    style: {
        base: {
            fontSize: '16px',
            color: '#0f4d91',
            fontFamily: '"Inter", Arial, sans-serif'
        }
    }
});

cardElement.mount('#card-element');

const prices = {
    student: 500,
    academic: 1000,
    industry: 3000
};

document.getElementById('membership-type')?.addEventListener('change', (e) => {
    const type = e.target.value;
    const amount = prices[type] || 0;
    document.getElementById('amount-display').textContent = `Total: ${amount} LSL`;
});

cardElement.addEventListener('change', (event) => {
    const displayError = document.getElementById('card-errors');
    if (event.error) {
        displayError.textContent = event.error.message;
        displayError.style.display = 'block';
    } else {
        displayError.textContent = '';
        displayError.style.display = 'none';
    }
});

document.getElementById('payment-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;

    const membershipType = document.getElementById('membership-type').value;
    const amount = prices[membershipType];
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    try {
        const response = await fetch('/api/payment/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, membershipType, name, email })
        });

        const data = await response.json();
        const clientSecret = data.clientSecret;

        const paymentResult = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: { name: name, email: email }
            }
        });

        if (paymentResult.error) {
            document.getElementById('card-errors').textContent = paymentResult.error.message;
            document.getElementById('card-errors').style.display = 'block';
        } else {
            const messageDiv = document.getElementById('payment-message');
            messageDiv.textContent = '✅ Payment successful! Your membership is confirmed.';
            messageDiv.className = 'form-message success';
            messageDiv.style.display = 'block';
            setTimeout(() => window.location.href = 'profile.html', 2000);
        }
    } catch (error) {
        document.getElementById('payment-message').textContent = 'Error: ' + error.message;
        document.getElementById('payment-message').style.display = 'block';
    }

    submitButton.disabled = false;
});

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('membership-type').value = '';
});
