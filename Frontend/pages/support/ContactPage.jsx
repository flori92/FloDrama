import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageSquare, Send, AlertCircle } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageTransition from '../../components/animations/PageTransition';

/**
 * Page de contact pour FloDrama
 * Permet aux utilisateurs de contacter le service client
 */
const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Question générale',
    message: ''
  });
  
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    success: false,
    message: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation simple
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus({
        submitted: true,
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires.'
      });
      return;
    }
    
    // Simulation d'envoi du formulaire
    setTimeout(() => {
      setFormStatus({
        submitted: true,
        success: true,
        message: 'Votre message a été envoyé avec succès. Notre équipe vous répondra dans les plus brefs délais.'
      });
      
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        email: '',
        subject: 'Question générale',
        message: ''
      });
    }, 1000);
  };
  
  const contactOptions = [
    {
      icon: <Mail size={24} />,
      title: 'Email',
      description: 'hotline@flodrama.com',
      action: 'Envoyez-nous un email'
    },
    {
      icon: <Phone size={24} />,
      title: 'Téléphone',
      description: '+33 (0)1 23 45 67 89',
      action: 'Appelez-nous'
    },
    {
      icon: <MessageSquare size={24} />,
      title: 'Chat en direct',
      description: 'Disponible 7j/7 de 9h à 22h',
      action: 'Démarrer un chat'
    }
  ];
  
  return (
    <PageTransition type="slide" direction="right">
      <div className="bg-gray-900 text-white min-h-screen">
        <Navbar />
        
        <div className="container mx-auto px-4 py-12 pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex items-center justify-center mb-10">
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg inline-block">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-blue-500 rounded-lg opacity-20"></div>
                  <div className="absolute inset-2 bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-pink-500 text-5xl transform translate-x-1">▶</div>
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-center mb-2 text-pink-500">FloDrama</h1>
            <h2 className="text-2xl font-semibold text-center mb-10 text-gray-300">
              Contactez-nous
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {contactOptions.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-gray-800 p-6 rounded-lg text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-gray-700 rounded-full text-pink-500">
                    {option.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{option.title}</h3>
                  <p className="text-gray-300 mb-4">{option.description}</p>
                  <button className="text-pink-500 hover:text-pink-400 transition-colors">
                    {option.action}
                  </button>
                </motion.div>
              ))}
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 md:p-8">
              <h3 className="text-2xl font-semibold mb-6">Envoyez-nous un message</h3>
              
              {formStatus.submitted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`mb-6 p-4 rounded-md ${formStatus.success ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}
                >
                  <div className="flex items-start">
                    <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
                    <p>{formStatus.message}</p>
                  </div>
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-300">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-gray-700 border border-gray-600 text-white rounded-lg block w-full p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Votre nom"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-gray-700 border border-gray-600 text-white rounded-lg block w-full p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="votre.email@exemple.com"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="subject" className="block mb-2 text-sm font-medium text-gray-300">
                      Sujet
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="bg-gray-700 border border-gray-600 text-white rounded-lg block w-full p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="Question générale">Question générale</option>
                      <option value="Problème technique">Problème technique</option>
                      <option value="Abonnement">Abonnement</option>
                      <option value="Suggestion de contenu">Suggestion de contenu</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-300">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="5"
                      className="bg-gray-700 border border-gray-600 text-white rounded-lg block w-full p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Décrivez votre question ou problème en détail..."
                      required
                    ></textarea>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md transition-colors"
                  >
                    <Send size={18} className="mr-2" />
                    Envoyer le message
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default ContactPage;
