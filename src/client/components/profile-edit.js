import React, { useState } from 'react';

export const EditProfileForm = ({ currentUser, onUpdate }) => {
    const [formData, setFormData] = useState({
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        city: currentUser.city,
        primary_email: currentUser.primary_email,
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(formData); // API call to update the user's profile
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First Name"
            />
            <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last Name"
            />
            <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
            />
            <input
                type="email"
                name="primary_email"
                value={formData.primary_email}
                onChange={handleChange}
                placeholder="Primary Email"
            />
            <button type="submit">Update Profile</button>
        </form>
    );
};