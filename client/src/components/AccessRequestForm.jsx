import React, { useState } from "react";
import { FiUser, FiPhone, FiMail, FiUserCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import ImageCapture from "./ImageCapture.jsx";
import { getApiUrl, API_ENDPOINTS } from "../config/api";

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
    interviewPosition: "",
    interviewerName: "",
    interviewerPhone: "",
    interviewType: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const uploadCapturedImages = async (requestId) => {
    for (const imageData of capturedImages) {
      try {
        const file = dataURLtoFile(imageData, `capture-${Date.now()}.jpg`);
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);
        formDataUpload.append('requestId', requestId);

        const token = localStorage.getItem('adminToken') || 
                     localStorage.getItem('hrToken') || 
                     localStorage.getItem('token');

        const uploadTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Image upload timeout')), 30000);
        });

        const uploadPromise = fetch(getApiUrl(API_ENDPOINTS.UPLOAD), {
          method: 'POST',
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {},
          body: formDataUpload
        });

        const response = await Promise.race([uploadPromise, uploadTimeoutPromise]);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || 'Image upload failed');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const handleImageCapture = (imageUrl) => {
    setCapturedImages(prev => [...prev, imageUrl]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      alert('Phone number must be exactly 10 digits');
      return;
    }
    if (capturedImages.length === 0) {
      alert('Photo capture is mandatory. Please capture your photo before submitting.');
      return;
    }

    if (formData.purposeOfAccess === 'interview') {
      if (!formData.interviewPosition || !formData.interviewerName || !formData.interviewerPhone || !formData.interviewType) {
        alert('Please fill in all interview fields: Position, Interviewer Name, Interviewer Phone, and Interview Type');
        return;
      }
    }
    if (formData.purposeOfAccess === 'onboarding') {
      if (!formData.referenceName || !formData.referencePhoneNumber) {
        alert('Please fill in all onboarding fields: Reference Name and Reference Phone Number');
        return;
      }
    }
    if (formData.purposeOfAccess === 'training') {
      if (!formData.trainingName || !formData.trainerNumber || !formData.departmentName) {
        alert('Please fill in all training fields: Training Name, Trainer Number, and Department Name');
        return;
      }
    }
    if (formData.purposeOfAccess === 'assignment') {
      if (!formData.departmentName) {
        alert('Please fill in the Department Name for assignment');
        return;
      }
    }
    if (formData.purposeOfAccess === 'visitor') {
      if (!formData.visitorDescription) {
        alert('Please fill in the Description for visitor');
        return;
      }
    }
    if (formData.purposeOfAccess === 'client') {
      if (!formData.companyName || !formData.clientMobileNumber) {
        alert('Please fill in all client fields: Company Name and Mobile Number');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        purposeOfAccess: formData.purposeOfAccess,
        whomToMeet: formData.whomToMeet,
      };
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
      if (formData.purposeOfAccess === 'interview') {
        submitData.interviewPosition = formData.interviewPosition;
        submitData.interviewerName = formData.interviewerName;
        submitData.interviewerPhone = formData.interviewerPhone;
        submitData.interviewType = formData.interviewType;
      }
      submitData.images = [];

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please try again')), 60000);
      });

      const fetchPromise = fetch(getApiUrl(API_ENDPOINTS.REQUESTS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const submitResponse = await Promise.race([fetchPromise, timeoutPromise]);
      if (submitResponse.ok) {
        const result = await submitResponse.json();
        const requestId = result.requestId || result.data?.id || result.id;
        setIsSubmitting(false);
        setShowSuccess(true);
        if (capturedImages.length > 0 && requestId) {
          uploadCapturedImages(requestId).catch(() => {});
        }
        setTimeout(() => {
          setShowSuccess(false);
          setCapturedImages([]);
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
            interviewPosition: "",
            interviewerName: "",
            interviewerPhone: "",
            interviewType: "",
          });
        }, 3000);
      } else {
        const errorData = await submitResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Unknown error occurred';
        alert(`Form submission failed: ${errorMessage}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        alert('Request timed out. Please check your internet connection and try again.');
      } else {
        alert(`Error submitting form: ${error.message || 'Network error occurred'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };
  const inputVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
  };

  if (showSuccess)
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-700 to-purple-700 text-white p-4">
        <div className="max-w-4xl w-full space-y-6">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-12 shadow-xl text-center">
            <div className="text-4xl sm:text-6xl mb-4 animate-pulse">✅</div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Request Submitted!</h1>
            <p className="text-white/80 mb-6 text-sm sm:text-base">You will be notified once approved.</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-3xl w-full backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 space-y-4 sm:space-y-6 border border-white/20">
        <motion.h1 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-2xl sm:text-4xl font-bold text-white text-center mb-4 sm:mb-6"
        >
          Access Request
        </motion.h1>

        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-4 sm:space-y-5"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4"
            variants={inputVariants}
          >
            <motion.div className="flex flex-col" variants={inputVariants}>
              <label className="text-white/80 mb-1 flex items-center gap-2 text-sm sm:text-base">
                <FiUser /> Full Name *
              </label>
              <motion.input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base transition-all duration-300"
                placeholder="Enter Your FullName "
                whileFocus="focus"
                variants={inputVariants}
              />
            </motion.div>
            <motion.div className="flex flex-col" variants={inputVariants}>
              <label className="text-white/80 mb-1 flex items-center gap-2 text-sm sm:text-base">
                <FiPhone /> Phone Number *
              </label>
              <motion.input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                maxLength="10"
                className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base transition-all duration-300"
                placeholder="Enter Your Number "
                whileFocus="focus"
                variants={inputVariants}
              />
            </motion.div>
          </motion.div>

          <motion.div className="flex flex-col" variants={inputVariants}>
            <label className="text-white/80 mb-1 flex items-center gap-2 text-sm sm:text-base">
              <FiMail /> Email *
            </label>
            <motion.input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base transition-all duration-300"
              placeholder="Enter Your Email"
              whileFocus="focus"
              variants={inputVariants}
            />
          </motion.div>

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
              placeholder=" Name"
            />
          </div>

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
                  placeholder="Enter Number"
                />
              </div>
            </div>
          )}

          {formData.purposeOfAccess === 'interview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-white/80 mb-1">Position Applied For *</label>
                <input
                  type="text"
                  name="interviewPosition"
                  value={formData.interviewPosition}
                  onChange={handleChange}
                  required={formData.purposeOfAccess === 'interview'}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Position Title"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-white/80 mb-1">Interview Type *</label>
                <select
                  name="interviewType"
                  value={formData.interviewType}
                  onChange={handleChange}
                  required={formData.purposeOfAccess === 'interview'}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="" className="bg-gray-800 text-white">Select interview type</option>
                  <option value="technical" className="bg-gray-800 text-white">Technical Interview</option>
                  <option value="hr" className="bg-gray-800 text-white">HR Interview</option>
                  <option value="managerial" className="bg-gray-800 text-white">Managerial Interview</option>
                  <option value="final" className="bg-gray-800 text-white">Final Interview</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-white/80 mb-1">Interviewer Name *</label>
                <input
                  type="text"
                  name="interviewerName"
                  value={formData.interviewerName}
                  onChange={handleChange}
                  required={formData.purposeOfAccess === 'interview'}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Interviewer Name"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-white/80 mb-1">Interviewer Phone *</label>
                <input
                  type="tel"
                  name="interviewerPhone"
                  value={formData.interviewerPhone}
                  onChange={handleChange}
                  required={formData.purposeOfAccess === 'interview'}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Enter Number"
                />
              </div>
            </div>
          )}

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
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Training Name"
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
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Enter Number"
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
                  className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Department Name"
                />
              </div>
            </div>
          )}

          {formData.purposeOfAccess === 'assignment' && (
            <div className="flex flex-col">
              <label className="text-white/80 mb-1">Department Name *</label>
              <input
                type="text"
                name="departmentName"
                value={formData.departmentName}
                onChange={handleChange}
                required={formData.purposeOfAccess === 'assignment'}
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Department Name"
              />
            </div>
          )}

          {formData.purposeOfAccess === 'visitor' && (
            <div className="flex flex-col">
              <label className="text-white/80 mb-1">Description *</label>
              <textarea
                name="visitorDescription"
                value={formData.visitorDescription}
                onChange={handleChange}
                required={formData.purposeOfAccess === 'visitor'}
                className="px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="Enter description"
              />
            </div>
          )}

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
                  placeholder="Enter Number"
                />
              </div>
            </div>
          )}

          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ImageCapture onImageCapture={handleImageCapture} />
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-3 rounded-xl transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default AccessRequestForm;
