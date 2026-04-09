import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './liveStreamPage.css'



export default function LiveStreamPage({ onNavigate, user, onAuthChange, channel }) {
    return (
        <div className="gh-page">
            <Navbar onNavigate={onNavigate} currentView="live-stream" user={user} onAuthChange={onAuthChange} />
            <main style={{ marginTop: '100px' }}>
                <div className="stream-container">
                    <div className="stream-box">
                        <h1>Live Stream</h1>
                        <iframe className='twitch-stream'
                            src={`https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`}
                            allowFullScreen
                        ></iframe>
                    </div>
                    <div className="chat-container">
                        <iframe src={`https://www.twitch.tv/embed/${channel}/chat?parent=${window.location.hostname}&darkpopout`} className="chatBox"></iframe>
                    </div>
                </div>
            </main >
            <Footer />
        </div >
    )
}