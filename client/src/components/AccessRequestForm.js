import React, { useState } from "react";
import { FiUser, FiPhone, FiMail, FiUserCheck } from "react-icons/fi";

const AccessRequestForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    purposeOfAccess: "",
    whomToMeet: "",
    referenceName: "",
    referencePhoneNumber: "",
    companyName: "",
    visitDate: "",
    visitTime: "",
    vehicleNumber: "",
    emergencyContact: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit form data to backend
      const submitData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        purposeOfAccess: formData.purposeOfAccess,
        whomToMeet: formData.whomToMeet,
        referenceName: formData.referenceName,
        referencePhoneNumber: formData.referencePhoneNumber,
        companyName: formData.companyName,
        visitDate: formData.visitDate,
        visitTime: formData.visitTime,
        vehicleNumber: formData.vehicleNumber,
        emergencyContact: formData.emergencyContact,
      };

      const submitResponse = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (submitResponse.ok) {
        const result = await submitResponse.json();
        console.log('Form submitted successfully:', result);
        setIsSubmitting(false);
        setShowSuccess(true);
        
        // Reset form after success
        setTimeout(() => {
          setShowSuccess(false);
          setFormData({
            fullName: "",
            phoneNumber: "",
            email: "",
            purposeOfAccess: "",
            whomToMeet: "",
            referenceName: "",
            referencePhoneNumber: "",
            companyName: "",
            visitDate: "",
            visitTime: "",
            vehicleNumber: "",
            emergencyContact: "",
          });
        }, 3000);
      } else {
        const errorResult = await submitResponse.json();
        throw new Error(errorResult.message || 'Form submission failed');
      }

    } catch (error) {
      console.error('Form submission error:', error);
      setIsSubmitting(false);
    }
  };

  if (showSuccess)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-700 to-purple-700 text-white">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 shadow-xl text-center">
          <div className="text-6xl mb-4 animate-pulse">✅</div>
          <h1 className="text-3xl font-semibold mb-2">Request Submitted!</h1>
          <p className="text-white/80">You will be notified once approved.</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-8 px-4">
      <div className="max-w-3xl w-full backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl p-8 space-y-6 border border-white/20">
        <h1 className="text-4xl font-bold text-white text-center mb-6">
          Access Request
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-white/80 mb-1 flex items-center gap-2">
                <FiUser /> Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="John Doe"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-white/80 mb-1 flex items-center gap-2">
                <FiPhone /> Phone *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-white/80 mb-1 flex items-center gap-2">
              <FiMail /> Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="you@example.com"
            />
          </div>

          {/* Visit Details */}
          <div className="flex flex-col">
            <label className="text-white/80 mb-1">Purpose of Access *</label>
            <textarea
              name="purposeOfAccess"
              value={formData.purposeOfAccess}
              onChange={handleChange}
              required
              rows={3}
              className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              placeholder="Reason for your visit"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-white/80 mb-1">Whom to Meet *</label>
              <input
                type="text"
                name="whomToMeet"
                value={formData.whomToMeet}
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Host Name"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-white/80 mb-1">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Your Company"
              />
            </div>
          </div>

          {/* Visit Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-white/80 mb-1">Visit Date *</label>
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-white/80 mb-1">Visit Time *</label>
              <input
                type="time"
                name="visitTime"
                value={formData.visitTime}
                onChange={handleChange}
                required
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-white/80 mb-1">Vehicle Number</label>
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="KA 01 AB 1234"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-white/80 mb-1">Emergency Contact</label>
              <input
                type="tel"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-white/80 mb-1">Reference Name</label>
              <input
                type="text"
                name="referenceName"
                value={formData.referenceName}
                onChange={handleChange}
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder="Ref Name"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-white/80 mb-1">Reference Phone</label>
              <input
                type="tel"
                name="referencePhoneNumber"
                value={formData.referencePhoneNumber}
                onChange={handleChange}
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccessRequestForm;
