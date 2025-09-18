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
    trainingName: "",
    trainerNumber: "",
    departmentName: "",
    visitorDescription: "",
    companyName: "",
    clientMobileNumber: "",
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
      // Prepare submit data based on purpose of access
      const submitData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        purposeOfAccess: formData.purposeOfAccess,
        whomToMeet: formData.whomToMeet,
      };

      // Add conditional fields based on purpose
      if (formData.purposeOfAccess === 'onboarding') {
        submitData.referenceName = formData.referenceName;
        submitData.referencePhoneNumber = formData.referencePhoneNumber;
      }

      if (formData.purposeOfAccess === 'training') {
        submitData.trainingName = formData.trainingName;
        submitData.trainerNumber = formData.trainerNumber;
        submitData.departmentName = formData.departmentName;
      }

      if (formData.purposeOfAccess === 'assignment') {
        submitData.departmentName = formData.departmentName;
      }

      if (formData.purposeOfAccess === 'visitor') {
        submitData.visitorDescription = formData.visitorDescription;
      }

      if (formData.purposeOfAccess === 'client') {
        submitData.companyName = formData.companyName;
        submitData.clientMobileNumber = formData.clientMobileNumber;
      }

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
            trainingName: "",
            trainerNumber: "",
            departmentName: "",
            visitorDescription: "",
            companyName: "",
            clientMobileNumber: "",
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
            <select
              name="purposeOfAccess"
              value={formData.purposeOfAccess}
              onChange={handleChange}
              required
              className="px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="" className="bg-gray-800 text-white">Select purpose</option>
              <option value="onboarding" className="bg-gray-800 text-white">Onboarding</option>
              <option value="assignment" className="bg-gray-800 text-white">Assignment</option>
              <option value="interview" className="bg-gray-800 text-white">Interview</option>
              <option value="training" className="bg-gray-800 text-white">Training</option>
              <option value="visitor" className="bg-gray-800 text-white">Visitor</option>
              <option value="client" className="bg-gray-800 text-white">Client</option>
            </select>
          </div>

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

          {/* Reference Fields - Only show when purpose is 'onboarding' */}
          {formData.purposeOfAccess === 'onboarding' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-white/80 mb-1">Reference Name *</label>
                <input
                  type="text"
                  name="referenceName"
                  value={formData.referenceName}
                  onChange={handleChange}
                  required={formData.purposeOfAccess === 'onboarding'}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Reference Name"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-white/80 mb-1">Reference Phone *</label>
                <input
                  type="tel"
                  name="referencePhoneNumber"
                  value={formData.referencePhoneNumber}
                  onChange={handleChange}
                  required={formData.purposeOfAccess === 'onboarding'}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          )}

          {/* Training Fields - Only show when purpose is 'training' */}
          {formData.purposeOfAccess === 'training' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-white/80 mb-1">Training Name *</label>
                <input
                  type="text"
                  name="trainingName"
                  value={formData.trainingName}
                  onChange={handleChange}
                  required={formData.purposeOfAccess === 'training'}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Training Program Name"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-white/80 mb-1">Trainer Number *</label>
                <input
                  type="tel"
                  name="trainerNumber"
                  value={formData.trainerNumber}
                  onChange={handleChange}
                  required={formData.purposeOfAccess === 'training'}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-white/80 mb-1">Department Name *</label>
                <input
                  type="text"
                  name="departmentName"
                  value={formData.departmentName}
                  onChange={handleChange}
                  required={formData.purposeOfAccess === 'training'}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Department Name"
                />
              </div>
            </div>
          )}

          {/* Assignment Fields - Only show when purpose is 'assignment' */}
          {formData.purposeOfAccess === 'assignment' && (
            <div className="flex flex-col">
              <label className="text-white/80 mb-1">Department Name *</label>
              <input
                type="text"
                name="departmentName"
                value={formData.departmentName}
                onChange={handleChange}
                required={formData.purposeOfAccess === 'assignment'}
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Department Name"
              />
            </div>
          )}

          {/* Visitor Fields - Only show when purpose is 'visitor' */}
          {formData.purposeOfAccess === 'visitor' && (
            <div className="flex flex-col">
              <label className="text-white/80 mb-1">Description *</label>
              <textarea
                name="visitorDescription"
                value={formData.visitorDescription}
                onChange={handleChange}
                required={formData.purposeOfAccess === 'visitor'}
                rows="3"
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                placeholder="Purpose of visit description..."
              />
            </div>
          )}

          {/* Client Fields - Only show when purpose is 'client' */}
          {formData.purposeOfAccess === 'client' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-white/80 mb-1">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required={formData.purposeOfAccess === 'client'}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Company Name"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-white/80 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  name="clientMobileNumber"
                  value={formData.clientMobileNumber}
                  onChange={handleChange}
                  required={formData.purposeOfAccess === 'client'}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          )}

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
