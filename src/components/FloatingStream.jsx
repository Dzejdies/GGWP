import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './FloatingStream.css'

export default function FloatingStream({ channel, isActive = true }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLive, setIsLive] = useState(false)

  // Sprawdzanie czy stream faktycznie jest live przy pomocy darmowego GQL Twitcha
  useEffect(() => {
    if (!channel || !isActive) return;

    const checkStatus = async () => {
      try {
        const res = await fetch('https://gql.twitch.tv/gql', {
          method: 'POST',
          headers: {
            'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko', // Publiczny webowy client-id
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `query { user(login: "${channel}") { stream { id } } }`
          })
        });
        const data = await res.json();
        // Jeśli obiekt stream nie jest nullem, to znaczy że jest online
        setIsLive(data?.data?.user?.stream !== null);
      } catch (err) {
        console.error("Błąd sprawdzania statusu streamu:", err);
      }
    };

    checkStatus();
    // Odświeżaj status co 60 sekund
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, [channel, isActive]);

  // Jeśli stream jest nieaktywny, nie jest live albo jesteśmy na jego głównej stronie - nie pokazuj okienka
  if (!isActive || !isLive || location.pathname === '/live-stream') {
    return null
  }

  return (
    <div className={`floating-stream ${isMinimized ? 'minimized' : ''}`}>
      <div className="floating-stream-header">
        <span
          className="fs-title"
          onClick={() => navigate('/live-stream')}
          title="Przejdź do pełnego wymiaru na żywo"
        >
          🔴 Na żywo
        </span>
        <button
          className="fs-toggle-btn"
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? "Wzmocnij" : "Zminimalizuj"}
        >
          {isMinimized ? '🔼' : '🔽'}
        </button>
      </div>

      {!isMinimized && (
        <div className="floating-stream-content">
          <iframe
            src={`https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&muted=true`}
            height="100%"
            width="100%"
            allowFullScreen
            frameBorder="0"
          ></iframe>
        </div>
      )}
    </div>
  )
}
