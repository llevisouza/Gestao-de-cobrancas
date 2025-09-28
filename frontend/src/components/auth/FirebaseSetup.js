import React from 'react';

const FirebaseSetup = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              className="h-16 w-auto" 
              src="/WhatsApp_Image_2025-09-20_at_14.40.27-removebg-preview.png" 
              alt="Conexão Delivery" 
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Configuração do Firebase
          </h2>
          <p className="mt-2 text-gray-600">
            Configure as variáveis de ambiente para conectar ao Firebase
          </p>
        </div>

        <div className="card">
          <div className="alert alert-warning mb-6">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L4.054 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="font-medium text-warning-800">Firebase não configurado</h4>
              <p className="text-sm text-warning-700 mt-1">
                As variáveis de ambiente do Firebase não foram encontradas.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Passo 1: Criar arquivo .env.local
              </h3>
              <p className="text-gray-600 mb-4">
                Crie um arquivo <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env.local</code> na raiz do projeto com o seguinte conteúdo:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="text-sm text-gray-800">
{`REACT_APP_FIREBASE_API_KEY=sua-api-key-aqui
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu-projeto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Passo 2: Configurar Firebase Console
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-sm font-medium text-primary-700">1</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Criar projeto no Firebase</p>
                    <p className="text-sm text-gray-600">Acesse console.firebase.google.com e crie um novo projeto</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-sm font-medium text-primary-700">2</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Ativar Authentication</p>
                    <p className="text-sm text-gray-600">Habilite Email/Password na seção Authentication</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-sm font-medium text-primary-700">3</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Criar Firestore Database</p>
                    <p className="text-sm text-gray-600">Inicie em modo de teste na seção Firestore Database</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-sm font-medium text-primary-700">4</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Obter configurações</p>
                    <p className="text-sm text-gray-600">Copie as configurações em Project Settings Web App</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Passo 3: Reiniciar aplicação
              </h3>
              <p className="text-gray-600">
                Após configurar as variáveis, reinicie o servidor de desenvolvimento:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                <code className="text-sm text-gray-800">npm start</code>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-primary-800">Precisa de ajuda?</h4>
                <p className="text-sm text-primary-700 mt-1">
                  Consulte a documentação no arquivo README.md para instruções detalhadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseSetup;