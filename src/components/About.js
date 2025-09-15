import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiTarget, FiHeart, FiAward } from 'react-icons/fi';

const About = () => {
  const teamMembers = [
    {
      name: "Dr. Sarah Wilson",
      role: "Platform Director",
      image: "https://images.unsplash.com/photo-1494790108755-2616b2692788?w=300&h=300&fit=crop&crop=face",
      description: "Former Google HR with 15+ years in talent acquisition"
    },
    {
      name: "Michael Chen",
      role: "Technology Lead",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      description: "Ex-Microsoft engineer specializing in education technology"
    },
    {
      name: "Emily Rodriguez",
      role: "Student Success Manager",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
      description: "Career counselor with expertise in student development"
    }
  ];

  const values = [
    {
      icon: FiTarget,
      title: "Mission",
      description: "To bridge the gap between students and industry by providing meaningful internship opportunities that foster professional growth and career development."
    },
    {
      icon: FiHeart,
      title: "Vision",
      description: "To become the world's leading platform for internship connections, empowering the next generation of professionals with real-world experience."
    },
    {
      icon: FiAward,
      title: "Values",
      description: "Excellence, Innovation, Integrity, and Student Success drive everything we do. We believe in creating opportunities that transform careers."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              to="/" 
              className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to Home
            </Link>
            <div className="text-2xl font-bold text-primary-600">
              InternshipHub
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">About InternshipHub</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            Connecting ambitious students with exceptional internship opportunities worldwide
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Purpose</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're driven by a passion to transform how students discover and secure meaningful internship experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2020, InternshipHub emerged from a simple observation: talented students were struggling to find meaningful internship opportunities, while companies were missing out on fresh talent and perspectives.
                </p>
                <p>
                  Our founders, a team of former industry executives and education professionals, recognized the need for a platform that could effectively bridge this gap. They envisioned a space where students could not only find internships but also receive mentorship, track their progress, and build lasting professional relationships.
                </p>
                <p>
                  Today, we're proud to have facilitated over 50,000 successful internship placements, working with more than 1,500 partner companies across various industries. Our commitment to student success remains at the heart of everything we do.
                </p>
              </div>
            </div>
            <div className="lg:text-right">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop" 
                alt="Team collaboration" 
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our diverse team of professionals is dedicated to your success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-primary-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">By the Numbers</h2>
            <p className="text-xl">Our impact speaks for itself</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">10,000+</div>
              <div className="text-lg">Active Internships</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">50,000+</div>
              <div className="text-lg">Students Placed</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">1,500+</div>
              <div className="text-lg">Partner Companies</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">95%</div>
              <div className="text-lg">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of students who have found their perfect internship through our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <Link 
              to="/internships" 
              className="border border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Internships
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;