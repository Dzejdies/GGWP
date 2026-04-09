export default function NotificationRedirect({ onNavigate, notification }) {
    switch (notification.type) {
        case "team":
            return onNavigate('account', { tab: 'teams' })
        case "tournament":
            return onNavigate('tournaments-list')
        default:
            return onNavigate('tournaments-list')
    }
}