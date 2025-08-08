import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';

const PayPalButton = ({ 
  amount, 
  planName, 
  onSuccess, 
  onError, 
  onCancel,
  disabled = false 
}) => {
  const initialOptions = {
    "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "capture",
    "data-client-token": "client_token",
  };

  const createOrder = async (data, actions) => {
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: amount,
          description: `${planName} Plan - NLP Converter`
        })
      });

      const orderData = await response.json();
      
      if (orderData.success) {
        return orderData.orderId;
      } else {
        throw new Error(orderData.error);
      }
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      toast.error('Failed to create payment order');
      throw error;
    }
  };

  const onApprove = async (data, actions) => {
    try {
      const response = await fetch('/api/payments/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId: data.orderID
        })
      });

      const captureData = await response.json();
      
      if (captureData.success) {
        toast.success('Payment successful!');
        if (onSuccess) {
          onSuccess(captureData);
        }
      } else {
        throw new Error(captureData.error);
      }
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      toast.error('Payment processing failed');
      if (onError) {
        onError(error);
      }
    }
  };

  const onErrorHandler = (err) => {
    console.error('PayPal error:', err);
    toast.error('Payment error occurred');
    if (onError) {
      onError(err);
    }
  };

  const onCancelHandler = (data) => {
    console.log('PayPal payment cancelled:', data);
    toast.info('Payment cancelled');
    if (onCancel) {
      onCancel(data);
    }
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtons
        disabled={disabled}
        style={{
          layout: "vertical",
          color: "blue",
          shape: "rect",
          label: "paypal"
        }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onErrorHandler}
        onCancel={onCancelHandler}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalButton;
