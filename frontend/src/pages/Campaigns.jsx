import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Plus, Play, Pause, Trash2, ChevronLeft } from 'lucide-react'

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: 'agency-outreach-001',
      status: 'active',
      target: 'UK Marketing Agencies',
      angle: 'White-label AI SDR',
      sent: 0,
      replies: 0,
      meetings: 0
    }
  ])

  const toggleCampaign = (id) => {
    setCampaigns(campaigns.map(c => 
      c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c
    ))
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>
          <Bot color="#e94560" />
          Campaigns
        </h1>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ChevronLeft size={18} />
          Back to Dashboard
        </Link>
      </header>

      {/* Content */}
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px' }}>Your Outreach Campaigns</h2>
          <button className="btn btn-primary">
            <Plus size={18} />
            New Campaign
          </button>
        </div>

        <div className="campaign-list">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="campaign-item" style={{ padding: '20px' }}>
              <div className={`campaign-status ${campaign.status}`}></div>
              
              <div className="campaign-info" style={{ flex: 2 }}>
                <div className="campaign-name" style={{ fontSize: '18px' }}>{campaign.name}</div>
                <div className="campaign-meta">
                  {campaign.target} • {campaign.angle}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700' }}>{campaign.sent}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sent</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700' }}>{campaign.replies}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Replies</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-success)' }}>{campaign.meetings}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Meetings</div>
                </div>
              </div>

              <div className="campaign-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => toggleCampaign(campaign.id)}
                >
                  {campaign.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                  {campaign.status === 'active' ? 'Pause' : 'Resume'}
                </button>
                <button className="btn btn-sm btn-secondary" style={{ color: 'var(--accent)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {campaigns.length === 0 && (
          <div className="section-card text-center" style={{ padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <h3 style={{ marginBottom: '8px' }}>No campaigns yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Create your first outreach campaign to start booking meetings
            </p>
            <button className="btn btn-primary">
              <Plus size={18} />
              Create Campaign
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default Campaigns
