import React, { useState } from "react";
import { FiUser, FiPhone, FiMail, FiUserCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import ImageCapture from "./ImageCapture";
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
    // Interview fields
    interviewPosition: "",
    interviewerName: "",
    interviewerPhone: "",
    interviewType: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone number (must be exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      alert('Phone number must be exactly 10 digits');
      return;
    }
    
    // Validate that photo is captured (mandatory)
    if (capturedImages.length === 0) {
      alert('Photo capture is mandatory. Please capture your photo before submitting.');
      return;
    }
    
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

      if (formData.purposeOfAccess === 'interview') {
        submitData.interviewPosition = formData.interviewPosition;
        submitData.interviewerName = formData.interviewerName;
        submitData.interviewerPhone = formData.interviewerPhone;
        submitData.interviewType = formData.interviewType;
      }

      const submitResponse = await fetch(getApiUrl(API_ENDPOINTS.REQUESTS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (submitResponse.ok) {
        const result = await submitResponse.json();
        console.log('Form submitted successfully:', result);
        const requestId = result.requestId || result.data.id;
        setSubmittedRequestId(requestId);
        
        // Upload captured images if any exist
        if (capturedImages.length > 0) {
          await uploadCapturedImages(requestId);
        }
        
        setIsSubmitting(false);
        setShowSuccess(true);
        
        // Reset form after success
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
            // Interview fields
            interviewPosition: "",
            interviewerName: "",
            interviewerPhone: "",
            interviewType: "",
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

  const uploadCapturedImages = async (requestId) => {
    for (const imageData of capturedImages) {
      try {
        const file = dataURLtoFile(imageData, `capture-${Date.now()}.jpg`);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('requestId', requestId);

        const token = localStorage.getItem('adminToken') || 
                     localStorage.getItem('hrToken') || 
                     localStorage.getItem('token');

        await fetch('http://localhost:5000/api/images/upload', {
          method: 'POST',
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {},
          body: formData
        });
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
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

  const handleImageCapture = (imageUrl) => {
    setCapturedImages(prev => [...prev, imageUrl]);
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
          {/* Basic Info */}
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
                placeholder="John Doe"
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
                placeholder="9876543210"
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
              placeholder="you@example.com"
              whileFocus="focus"
              variants={inputVariants}
            />
          </motion.div>

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

          {/* Interview Fields - Only show when purpose is 'interview' */}
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

          {/* Live Image Capture */}
          <div className="mt-6">
            <h3 className="text-white/80 mb-4 text-lg font-semibold">Capture Your Photo *</h3>
            <p className="text-white/60 mb-4 text-sm">Photo capture is mandatory for identification purposes</p>
            <ImageCapture 
              onImageCapture={handleImageCapture}
            />
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
          >
            <motion.span
              animate={isSubmitting ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
              transition={isSubmitting ? { repeat: Infinity, duration: 1 } : {}}
            >
              {isSubmitting ? "Processing..." : "Submit Request"}
            </motion.span>
          </motion.button>
        </motion.form>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center"
                variants={successVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 360, 0]
                  }}
                  transition={{ 
                    duration: 0.8,
                    ease: "easeInOut"
                  }}
                >
                  <FiUserCheck className="text-green-600 text-2xl" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Request Submitted Successfully!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your access request has been submitted and is being processed.
                </p>
                <motion.button
                  onClick={() => setShowSuccess(false)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Close
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AccessRequestForm;

// Animation variants for form elements
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const inputVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4 }
  },
  focus: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

const successVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: -50,
    transition: { duration: 0.3 }
  }
};

// Enhanced micro-interaction variants
const microInteractionVariants = {
  tap: { scale: 0.95 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  focus: { 
    scale: 1.02, 
    boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.3)",
    transition: { duration: 0.2 }
  }
};

const feedbackVariants = {
  success: {
    scale: [1, 1.1, 1],
    backgroundColor: ["#4caf50", "#66bb6a", "#4caf50"],
    transition: { duration: 0.6 }
  },
  error: {
    x: [-10, 10, -10, 10, 0],
    backgroundColor: ["#f44336", "#ef5350", "#f44336"],
    transition: { duration: 0.4 }
  },
  loading: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" }
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.8, repeat: Infinity }
  }
};

const fieldValidationVariants = {
  valid: {
    borderColor: "#4caf50",
    boxShadow: "0 0 0 2px rgba(76, 175, 80, 0.2)",
    transition: { duration: 0.3 }
  },
  invalid: {
    borderColor: "#f44336",
    boxShadow: "0 0 0 2px rgba(244, 67, 54, 0.2)",
    x: [-5, 5, -5, 5, 0],
    transition: { duration: 0.4 }
  },
  typing: {
    borderColor: "#2196f3",
    boxShadow: "0 0 0 2px rgba(33, 150, 243, 0.2)",
    transition: { duration: 0.2 }
  }
};

const progressVariants = {
  initial: { width: "0%" },
  animate: { width: "100%" },
  transition: { duration: 2, ease: "easeInOut" }
};
