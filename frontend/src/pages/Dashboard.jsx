import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Bot, 
  RefreshCw, 
  Send, 
  MessageSquare, 
  Calendar, 
  Users,
  Target,
  Activity,
  Clock
} from 'lucide-react'

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    emailsSent: 0,
    emailsToday: 0,
    dailyLimit: 50,
    replyRate: 0,
    meetingsBooked: 0,
    activeLeads: 0
  })

  const [activities, setActivities] = useState([
    { id: 1, type: 'system', title: 'AI SDR initialized', meta: 'System ready to start outreach', time: 'Just now' }
  ])

  const [agents, setAgents] = useState([
    { name: 'Lead Research', task: 'Waiting to start', status: 'idle' },
    { name: 'Email Writer', task: 'Waiting to start', status: 'idle' },
    { name: 'Reply Analyzer', task: 'Waiting to start', status: 'idle' },
    { name: 'Meeting Booker', task: 'Waiting to start', status: 'idle' }
  ])

  useEffect(() => {
    // Load config
    const config = JSON.parse(localStorage.getItem('aisdr_config') || '{}')
    if (config.firstCampaign) {
      setMetrics(prev => ({
        ...prev,
        dailyLimit: config.firstCampaign.dailyLimit || 50
      }))
    }
  }, [])

  const refreshData = () => {
    // In real implementation, this would fetch from the orchestrator API
    console.log('Refreshing dashboard data...')
  }

  const progressPercent = (metrics.emailsToday / metrics.dailyLimit) * 100

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>
          <Bot color="#e94560" />
          AISDR Autonomous
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/campaigns" style={{ color: 'white', textDecoration: 'none' }}>
            Campaigns
          </Link>
          <div className="status-badge">
            <span className="status-dot"></span>
            AI SDR Active
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="dashboard-content">
        {/* Metrics Grid */}
        <div className="metrics-grid">
          <MetricCard 
            title="Emails Sent Today"
            value={metrics.emailsToday}
            change={`/ ${metrics.dailyLimit} limit`}
            showBar={true}
            barPercent={progressPercent}
          />
          <MetricCard 
            title="Reply Rate"
            value={`${metrics.replyRate}%`}
          />
          <MetricCard 
            title="Meetings Booked"
            value={metrics.meetingsBooked}
            positive={true}
          />
          <MetricCard 
            title="Active Leads"
            value={metrics.activeLeads}
          />
        </div>

        {/* Sub-Agents Status */}
        <section className="section-card">
          <h2>
            <Bot size={20} />
            Sub-Agent Swarm
          </h2>
          <div className="agent-grid">
            {agents.map((agent, i) => (
              <div key={i} className={`agent-card ${agent.status}`}>
                <div className="agent-name">{agent.name}</div>
                <div className="agent-task">{agent.task}</div>
                <span className="agent-status">{agent.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="section-card">
          <h2>
            <Activity size={20} />
            Recent Activity
          </h2>
          <ul className="activity-list">
            {activities.map((activity) => (
              <li key={activity.id} className="activity-item">
                <div className={`activity-icon ${
                  activity.type === 'send' ? 'blue' : 
                  activity.type === 'reply' ? 'green' : 
                  activity.type === 'meeting' ? 'orange' : 'blue'
                }`}>
                  {activity.type === 'send' && <Send size={18} />}
                  {activity.type === 'reply' && <MessageSquare size={18} />}
                  {activity.type === 'meeting' && <Calendar size={18} />}
                  {activity.type === 'system' && <Bot size={18} />}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-meta">{activity.meta}</div>
                </div>
                <div className="activity-time">{activity.time}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* Active Campaigns */}
        <section className="section-card">
          <h2>
            <Target size={20} />
            Active Campaigns
          </h2>
          <div className="campaign-list">
            <div className="campaign-item">
              <div className="campaign-status active"></div>
              <div className="campaign-info">
                <div className="campaign-name">agency-outreach-001</div>
                <div className="campaign-meta">Marketing Agencies • White-label AI SDR</div>
              </div>
              <div className="campaign-stats">
                <div>0 sent</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not started</div>
              </div>
              <div className="campaign-actions">
                <button className="btn btn-sm btn-secondary">Pause</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Refresh Button */}
      <button className="refresh-btn" onClick={refreshData}>
        <RefreshCw size={18} />
        Refresh
      </button>
    </div>
  )
}

const MetricCard = ({ title, value, change, showBar, barPercent, positive }) => (
  <div className="metric-card">
    <h3>{title}</h3>
    <div className="metric-value">
      {value}
      {change && <span className="metric-change">{change}</span>}
    </div>
    {showBar && (
      <div className="metric-bar">
        <div className="metric-bar-fill" style={{ width: `${Math.min(barPercent, 100)}%` }}></div>
      </div>
    )}
  </div>
)

export default Dashboard
