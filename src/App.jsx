import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Activity, Heart, Zap } from 'lucide-react';

// HARDCODED KEY
const GROQ_API_KEY = "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";

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

    const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // **MODEL UPDATED HERE**
          model: 'llama3-70b-8192',
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      const result = await response.json();
      
      if (result.choices && result.choices.length > 0) {
        return result.choices[0].message.content;
      } else {
        console.error('API Error from Groq:', result.error ? result.error.message : result);
        return "I'm having trouble generating your personalized health plan right now. (No response from AI) 🔄";
      }

    } catch (error) {
      console.error('Fetch Error:', error);
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
      
      const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // **MODEL UPDATED HERE**
          model: 'llama3-70b-8192',
          messages: [
            { role: 'user', content: conversationPrompt }
          ]
        })
      });

      const result = await response.json();
      
      let assistantResponse = "Oops! Something went wrong. Please try again! 😊";
      if (result.choices && result.choices.length > 0) {
        assistantResponse = result.choices[0].message.content;
      } else {
         console.error('API Error from Groq:', result.error ? result.error.message : result);
         assistantResponse = "I'm having trouble with that question right now. (No response from AI) 🔄";
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantResponse
      }]);

    } catch (error) {
      console.error('Fetch Error:', error);
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
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-purple-200 px-6 py-4 shadow-lg relative z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-3 rounded-2xl shadow-lg animate-pulse">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                Vitality
              </h1>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                Your AI Health Assistant
              </p>
            </div>
          </div>
          <Heart className="w-6 h-6 text-rose-500 animate-pulse" />
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 relative z-10">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] rounded-3xl px-5 py-4 shadow-lg transition-all hover:scale-[1.02] ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 text-white'
                    : 'bg-white/90 backdrop-blur-sm text-gray-800 border border-purple-100'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                    <span className="text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Vitality AI</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {/* Age Selection Buttons */}
          {showButtons && collectionStep === 'age' && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-5 py-4 shadow-xl border border-purple-100">
                <div className="flex flex-wrap gap-2">
                  {ageRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => handleAgeSelect(range.value)}
                      className="px-5 py-2.5 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-xl hover:scale-105 font-medium"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Gender Selection Buttons */}
          {showButtons && collectionStep === 'gender' && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-5 py-4 shadow-xl border border-purple-100">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleGenderSelect('Male')}
                    className="px-8 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-xl hover:scale-105 font-medium"
                  >
                    👨 Male
                  </button>
                  <button
                    onClick={() => handleGenderSelect('Female')}
                    className="px-8 py-3 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-xl hover:scale-105 font-medium"
                  >
                    👩 Female
                  </button>
                  <button
                    onClick={() => handleGenderSelect('Other')}
                    className="px-8 py-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-xl hover:scale-105 font-medium"
                  >
                    🌟 Other
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Height Selection */}
          {showButtons && collectionStep === 'height' && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-5 py-4 shadow-xl border border-purple-100 max-w-md">
                <p className="text-sm font-semibold text-gray-700 mb-3">Select Feet:</p>
                <div className="flex gap-2 mb-4">
                  {heightOptions.feet.map((feet) => (
                    <button
                      key={feet}
                      onClick={() => {
                        setUserData(prev => ({ ...prev, heightFeet: feet }));
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        userData.heightFeet === feet
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {feet}'
                    </button>
                  ))}
                </div>
                {userData.heightFeet && (
                  <>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Select Inches:</p>
                    <div className="grid grid-cols-6 gap-2">
                      {heightOptions.inches.map((inches) => (
                        <button
                          key={inches}
                          onClick={() => handleHeightSelect(userData.heightFeet, inches)}
                          className="px-3 py-2 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg hover:scale-105 font-medium text-sm"
                        >
                          {inches}"
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {/* Weight Selection Buttons */}
          {showButtons && collectionStep === 'weight' && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-5 py-4 shadow-xl border border-purple-100">
                <div className="flex flex-wrap gap-2">
                  {weightRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => handleWeightSelect(range.value)}
                      className="px-5 py-2.5 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-md hover:shadow-xl hover:scale-105 font-medium"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-5 py-4 shadow-xl border border-purple-100">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-3 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Input */}
      {collectionStep === 'complete' && (
        <div className="bg-white/90 backdrop-blur-xl border-t border-purple-200 px-4 py-5 shadow-lg relative z-10">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about health, fitness, or nutrition..."
              className="flex-1 px-5 py-4 rounded-2xl border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-lg text-gray-800 placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white px-6 py-4 rounded-2xl hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Add this to your global CSS or in a style tag
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }`;
document.head.appendChild(style);
