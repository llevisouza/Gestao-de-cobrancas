// src/components/auth/FirebaseSetup.js
import React, { useState } from 'react';

const FirebaseSetup = () => {
  // const [step, setStep] = useState(1); // Esta linha foi removida pois não era utilizada
  const [completedSteps, setCompletedSteps] = useState([]);

  const steps = [
    {
      id: 1,
      title: "Criar Projeto no Firebase",
      color: "blue",
      icon: "🔥",
      instructions: [
        "Acesse o Firebase Console",
        "Clique em \"Criar um projeto\" ou \"Add project\"",
        "Nomeie seu projeto (ex: \"sistema-cobrancas\")",
        "Configure o Analytics (opcional)",
        "Clique em \"Criar projeto\""
      ],
      link: "https://console.firebase.google.com"
    },
    {
      id: 2,
      title: "Configurar Authentication",
      color: "green",
      icon: "🔐",
      instructions: [
        "No painel do Firebase, vá para \"Authentication\"",
        "Clique em \"Começar\" ou \"Get started\"",
        "Na aba \"Sign-in method\", habilite \"Email/password\"",
        "Salve as configurações",
        "Na aba \"Users\", clique em \"Add user\" para criar um usuário de teste"
      ]
    },
    {
      id: 3,
      title: "Configurar Firestore Database",
      color: "purple",
      icon: "📊",
      instructions: [
        "No painel do Firebase, vá para \"Firestore Database\"",
        "Clique em \"Criar banco de dados\"",
        "Escolha \"Iniciar no modo de teste\" (para desenvolvimento)",
        "Selecione a localização (us-central recomendado)",
        "Clique em \"Concluído\""
      ]
    },
    {
      id: 4,
      title: "Obter Configuração do Projeto",
      color: "yellow",
      icon: "⚙️",
      instructions: [
        "No painel principal do Firebase, clique no ícone de configurações (engrenagem)",
        "Vá para \"Configurações do projeto\"",
        "Na seção \"Seus apps\", clique em \"Web\" (ícone </>)",
        "Registre seu app com um nome",
        "Copie o código de configuração fornecido",
        "Cole no arquivo .env.local do projeto"
      ]
    }
  ];

  const toggleStep = (stepId) => {
    if (completedSteps.includes(stepId)) {
      setCompletedSteps(prev => prev.filter(id => id !== stepId));
    } else {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  };

  const getStepColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 text-blue-800",
      green: "bg-green-50 border-green-200 text-green-800",
      purple: "bg-purple-50 border-purple-200 text-purple-800",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-800"
    };
    return colors[color] || colors.blue;
  };

  const allStepsCompleted = completedSteps.length === steps.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-8 text-center">
            <div className="text-6xl mb-4">🔥</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Configuração do Firebase
            </h1>
            <p className="text-orange-100 text-lg">
              Configure seu projeto Firebase para usar o sistema de cobranças
            </p>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progresso
              </span>
              <span className="text-sm text-gray-500">
                {completedSteps.length} de {steps.length} concluídos
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="p-6 space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`border-2 rounded-lg p-6 transition-all duration-200 ${
                  completedSteps.includes(step.id)
                    ? 'border-green-200 bg-green-50'
                    : getStepColorClasses(step.color)
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{step.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold">
                        Passo {step.id}: {step.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStep(step.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                      completedSteps.includes(step.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {completedSteps.includes(step.id) ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Concluído
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Marcar como feito
                      </>
                    )}
                  </button>
                </div>

                <ol className="space-y-2 text-gray-700">
                  {step.instructions.map((instruction, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                        {i + 1}
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>

                {step.link && (
                  <div className="mt-4">
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-1a1 1 0 10-2 0v1H5V7h1a1 1 0 000-2H5z" />
                      </svg>
                      <span>Abrir Firebase Console</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Environment Variables */}
          <div className="bg-gray-900 text-green-400 p-6 m-6 rounded-lg">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Arquivo .env.local</span>
            </h4>
            <p className="text-gray-300 mb-4">
              Crie um arquivo .env.local na raiz do projeto com estas variáveis:
            </p>
            <pre className="text-sm bg-black p-4 rounded border overflow-x-auto">
{`REACT_APP_FIREBASE_API_KEY=sua-api-key-aqui
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu-projeto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456`}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {allStepsCompleted ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Configuração concluída!</span>
                </div>
              ) : (
                `${steps.length - completedSteps.length} passos restantes`
              )}
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className={`px-6 py-2 rounded-md font-medium transition ${
                allStepsCompleted
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              {allStepsCompleted ? 'Acessar Sistema' : 'Recarregar Página'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseSetup;