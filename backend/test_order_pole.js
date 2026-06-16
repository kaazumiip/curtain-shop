const axios = require('axios');

const testOrder = async () => {
  try {
    const orderData = {
      customer: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        address: '123 Street',
        city: 'Phnom Penh',
        postcode: '12000',
        phone: '012345678'
      },
      paymentMethod: 'ABA Bank',
      items: [
        {
          name: 'Curtain Test',
          price: 50,
          totalPrice: 50,
          selectedSize: { name: '140x250', price: 50, width: 1.4 },
          poleColor: 'Gold',
          imageUrl: 'https://via.placeholder.com/150'
        }
      ],
      subtotal: 50
    };

    const res = await axios.post('http://localhost:5000/api/orders', orderData);
    console.log('Order created:', res.data._id);
    console.log('Items in saved order:', JSON.stringify(res.data.items, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
};

testOrder();
