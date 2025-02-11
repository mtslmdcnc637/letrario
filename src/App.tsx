import React, { useState, useRef } from 'react';
import { Mic } from 'lucide-react';

function App() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  const handleKeyClick = (key: string) => {
    setText(prev => prev + key);
  };

  const handleSpace = () => {
    setText(prev => prev + ' ');
  };

  const sendTextToWebhook = async () => {
    if (!text.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch('https://n8n.atendimentoaocliente.shop/webhook-test/texto-pra-voz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to send text');
      }

      const data = await response.json();
      
      // If the response contains a base64 audio data, play it
      if (data.audioBase64) {
        if (audioRef.current) {
          const audioData = data.audioBase64;
          audioRef.current.src = `data:audio/mpeg;base64,${audioData}`;
          audioRef.current.play().catch(error => {
            console.error('Error playing audio:', error);
            alert('Erro ao reproduzir o áudio.');
          });
        }
      }
    } catch (error) {
      console.error('Error sending text:', error);
      alert('Erro ao enviar o texto para conversão em voz.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceInput = () => {
    if (text.trim()) {
      sendTextToWebhook();
      return;
    }

    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => prev + ' ' + transcript);
      };

      recognition.start();
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  };

  return (
    <div className="h-screen bg-gray-900 grid grid-rows-2">
      {/* Hidden audio element for playing the response */}
      <audio ref={audioRef} className="hidden" />

      {/* Text Display Area */}
      <div className="w-full flex items-center justify-center p-4">
        <p className="text-white text-xl sm:text-2xl text-center break-words max-w-[90%] sm:max-w-[80%]">
          {text || 'Digite algo...'}
        </p>
      </div>

      {/* Keyboard Area */}
      <div className="w-full bg-gray-800 p-4">
        <div className="h-full max-w-3xl mx-auto space-y-2">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1 sm:gap-2">
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyClick(key)}
                  className="flex-1 sm:flex-initial sm:w-12 h-12 bg-gray-700 text-white 
                           rounded-lg font-semibold shadow-lg hover:bg-gray-600 
                           active:bg-gray-500 transition-colors duration-150 
                           flex items-center justify-center text-sm sm:text-base"
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
          <div className="flex justify-center gap-1 sm:gap-2">
            <button
              onClick={handleSpace}
              className="flex-1 sm:w-64 h-12 bg-gray-700 text-white rounded-lg 
                       font-semibold shadow-lg hover:bg-gray-600 active:bg-gray-500 
                       transition-colors duration-150"
            >
              Space
            </button>
            <button
              onClick={handleVoiceInput}
              disabled={isSending}
              className={`w-12 h-12 ${
                isListening ? 'bg-green-600' : isSending ? 'bg-green-700' : 'bg-green-500'
              } text-white rounded-lg font-semibold shadow-lg 
              hover:bg-green-600 active:bg-green-700 transition-colors 
              duration-150 flex items-center justify-center
              disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Mic size={20} className={isSending ? 'animate-pulse' : ''} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
