import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiCheckCircle, FiExternalLink, FiArrowLeft } from 'react-icons/fi';

const SetupGuide = () => {
  const setupSteps = [
    {
      title: "Enable Email/Password Authentication",
      description: "Go to Firebase Console → Authentication → Sign-in method → Enable Email/Password",
      status: "required",
      link: "https://console.firebase.google.com/"
    },
    {
      title: "Configure Firestore Database",
      description: "Create a Firestore database in your Firebase project for storing user data and internships",
      status: "required",
      link: "https://console.firebase.google.com/"
    },
    {
      title: "Set up Security Rules",
      description: "Configure Firestore security rules to protect your data",
      status: "recommended",
      link: "https://firebase.google.com/docs/firestore/security/get-started"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to home button */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Firebase Setup Guide</h1>
            <p className="text-primary-100 mt-2">Complete these steps to get your internship portal running</p>
          </div>

          <div className="p-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <FiAlertCircle className="text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Setup Required</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Some Firebase features need to be enabled before you can use the application.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {setupSteps.map((step, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === 'required' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      {step.status === 'required' ? (
                        <FiAlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <FiCheckCircle className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Step {index + 1}: {step.title}
                      </h3>
                      <p className="text-gray-700 mb-4">{step.description}</p>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          step.status === 'required' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {step.status === 'required' ? 'Required' : 'Recommended'}
                        </span>
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Open Firebase Console
                          <FiExternalLink className="ml-1 w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Setup Instructions</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                  <span>Go to <a href="https://console.firebase.google.com/" className="underline" target="_blank" rel="noopener noreferrer">Firebase Console</a></span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                  <span>Select your project: <strong>scontitech-286b2</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                  <span>Navigate to <strong>Authentication</strong> → <strong>Sign-in method</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                  <span>Click on <strong>Email/Password</strong> and toggle <strong>Enable</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">5</span>
                  <span>Click <strong>Save</strong> and refresh this page</span>
                </li>
              </ol>
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Try Registration Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;
