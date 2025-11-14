import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Activity, Heart, Zap } from 'lucide-react';

// **FIX 1: Use VITE prefix for environment variables**
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function VitalityHealthBot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm Vitality, your personal health assistant. 🌟 To give you personalized health tips, I need some information about you. Let's start with your age:"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState({
    age: null,
    heightFeet: null,
    heightInches: null,
    weight: null,
    gender: null
  });
  const [collectionStep, setCollectionStep] = useState('age');
  const [showButtons, setShowButtons] = useState(false);
  const [typingEffect, setTypingEffect] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const ageRanges = [
    { label: '13-17', value: 15 },
    { label: '18-25', value: 21 },
    { label: '26-35', value: 30 },
    { label: '36-45', value: 40 },
    { label: '46-55', value: 50 },
    { label: '56-65', value: 60 },
    { label: '66+', value: 70 }
  ];
  const heightOptions = {
    feet: [4, 5, 6, 7],
    inches: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  };
  const weightRanges = [
    { label: '40-50 kg', value: 45 },
    { label: '51-60 kg', value: 55 },
    { label: '61-70 kg', value: 65 },
    { label: '71-80 kg', value: 75 },
    { label: '81-90 kg', value: 85 },
    { label: '91-100 kg', value: 95 },
    { label: '100+ kg', value: 105 }
  ];

  const getPromptForStep = (step) => {
    switch(step) {
      case 'age':
        return "Great! Select your age range:";
      case 'gender':
        return "Perfect! Now, select your gender:";
      case 'height':
        return "Awesome! Select your height:";
      case 'weight':
        return "Almost done! Select your weight range:";
      default:
        return '';
    }
  };

  const addMessage = (role, content) => {
    setTypingEffect(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role, content }]);
      setTypingEffect(false);
    }, 300);
  };

  const handleAgeSelect = (age) => {
    setUserData(prev => ({ ...prev, age }));
    addMessage('user', ageRanges.find(r => r.value === age).label);
    setShowButtons(false);
    setTimeout(() => {
      setCollectionStep('gender');
      setShowButtons(true);
      addMessage('assistant', getPromptForStep('gender'));
    }, 500);
  };

  const handleGenderSelect = (gender) => {
    setUserData(prev => ({ ...prev, gender }));
    addMessage('user', gender);
    setShowButtons(false);
    setTimeout(() => {
      setCollectionStep('height');
      setShowButtons(true);
      addMessage('assistant', getPromptForStep('height'));
    }, 500);
  };

  const handleHeightSelect = (feet, inches) => {
    setUserData(prev => ({ ...prev, heightFeet: feet, heightInches: inches }));
    addMessage('user', `${feet}'${inches}"`);
    setShowButtons(false);
    setTimeout(() => {
      setCollectionStep('weight');
      setShowButtons(true);
      addMessage('assistant', getPromptForStep('weight'));
    }, 500);
  };

  const handleWeightSelect = async (weight) => {
    setUserData(prev => ({ ...prev, weight }));
    addMessage('user', weightRanges.find(r => r.value === weight).label);
    setShowButtons(false);
    setCollectionStep('complete');

    setTimeout(async () => {
      addMessage('assistant', "Perfect! Let me create your personalized health plan... ⏳");
      setIsLoading(true);

      const finalUserData = { ...userData, weight };
      const analysis = await getHealthAnalysis(finalUserData);

      setTimeout(() => {
        setIsLoading(false);
        addMessage('assistant', analysis);
        setTimeout(() => {
          addMessage('assistant', "Feel free to ask me any health questions! 💪");
        }, 1000);
      }, 1500);
    }, 500);
  };

  const getHealthAnalysis = async (data) => {
    const heightInCm = (data.heightFeet * 30.48) + (data.heightInches * 2.54);
    const bmi = (data.weight / ((heightInCm / 100) ** 2)).toFixed(1);

    const prompt = `You are Vitality, a friendly and modern health assistant. Provide personalized health advice based on:- Age: ${data.age} years- Gender: ${data.gender}- Height: ${data.heightFeet}'${data.heightInches}" (${heightInCm.toFixed(0)} cm)- Weight: ${data.weight} kg- BMI: ${bmi}Provide a comprehensive health analysis in a conversational, engaging tone:1. **Your Health Overview** - Brief BMI interpretation with encouraging words2. **Daily Routine** - Morning and evening routines tailored to their age3. **Workout Plan** - Specific exercises with duration (suitable for their fitness level)4. **Nutrition Guide** - Meal ideas, portions, and what to avoid5. **Lifestyle Tips** - Sleep schedule, hydration, stress management6. **Mental Wellness** - Mindfulness practices, hobbies, social connectionsUse emojis naturally. Be motivating and practical. Keep it modern and friendly, not medical or boring. Make it actionable with specific examples.`;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { "text": prompt }
              ]
            }
          ]
        })
      });

      const result = await response.json();
      
      if (result.candidates && result.candidates.length > 0) {
        return result.candidates[0].content.parts[0].text;
      } else {
        console.error('API Error or no candidates:', result);
        return "I'm having new trouble generating your personalized health plan right now. (No response from AI) 🔄";
      }

    } catch (error) {
      console.error('API Error:', error);
      return "I'm having trouble generating your personalized health plan right now. Please try again! 🔄";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationPrompt = `You are Vitality, a friendly health assistant. The user has provided their health data:- Age: ${userData.age}, Gender: ${userData.gender}, Height: ${userData.heightFeet}'${userData.heightInches}", Weight: ${userData.weight}kgUser's question: ${input}Provide a helpful, friendly response related to health, fitness, nutrition, or wellness. Be conversational and supportive. Use emojis occasionally.`;
      
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { "text": conversationPrompt }
              ]
            }
          ]
        })
      });

      const result = await response.json();
      
      let assistantResponse = "Oops! Something went wrong. Please try again! 😊";
      if (result.candidates && result.candidates.length > 0) {
        assistantResponse = result.candidates[0].content.parts[0].text;
      } else {
         console.error('API Error or no candidates:', result);
         assistantResponse = "I'm having trouble with that question right now. (No response from AI) 🔄";
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantResponse
      }]);

    } catch (error) {
      setMessages(prev => [...prev, {
         role: 'assistant',
         content: "Oops! Something went wrong. Please try again! 😊"
       }]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (collectionStep === 'age' && messages.length === 1) {
      setTimeout(() => {
        setShowButtons(true);
        addMessage('assistant', getPromptForStep('age'));
      }, 800);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur
