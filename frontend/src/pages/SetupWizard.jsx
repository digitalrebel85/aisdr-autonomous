import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, ChevronRight, ChevronLeft, Check, Target, Key, Rocket } from 'lucide-react'

const SetupWizard = ({ onComplete }) => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState({
    icp: {
      industry: '',
      companySize: '',
      location: '',
      jobTitles: '',
      painPoints: ''
    },
    platforms: {
      apolloKey: '',
      nylasClientId: '',
      nylasSecret: '',
      openaiKey: '',
      supabaseUrl: '',
      supabaseKey: ''
    },
    firstCampaign: {
      name: 'agency-outreach-001',
      dailyLimit: 50,
      sequenceSteps: 4
    }
  })

  const totalSteps = 4

  const updateConfig = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Save config and complete
      localStorage.setItem('aisdr_config', JSON.stringify(config))
      onComplete()
      navigate('/dashboard')
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return true // Welcome screen
      case 2:
        return config.icp.industry && config.icp.companySize
      case 3:
        return config.platforms.apolloKey && config.platforms.openaiKey
      case 4:
        return config.firstCampaign.name
      default:
        return false
    }
  }

  return (
    <div className="wizard-container">
      <div className="wizard-card">
        {/* Header */}
        <div className="wizard-header">
          <h1>
            <Bot size={32} color="#e94560" />
            AISDR Autonomous
          </h1>
          <p>Deploy your AI SDR in 4 steps</p>
        </div>

        {/* Step Indicators */}
        <div className="wizard-steps">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`step-indicator ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="wizard-content">
          {step === 1 && <WelcomeStep />}
          {step === 2 && <ICPStep config={config.icp} updateConfig={updateConfig} />}
          {step === 3 && <PlatformStep config={config.platforms} updateConfig={updateConfig} />}
          {step === 4 && <CampaignStep config={config.firstCampaign} updateConfig={updateConfig} />}
        </div>

        {/* Actions */}
        <div className="wizard-actions">
          {step > 1 ? (
            <button className="btn btn-secondary" onClick={handleBack}>
              <ChevronLeft size={18} />
              Back
            </button>
          ) : (
            <div></div>
          )}
          <button 
            className="btn btn-primary" 
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {step === totalSteps ? 'Launch AI SDR' : 'Continue'}
            {step === totalSteps ? <Rocket size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// Step 1: Welcome
const WelcomeStep = () => (
  <div className="text-center">
    <div className="success-icon">
      <Bot color="white" />
    </div>
    <h2>Welcome to AISDR Autonomous</h2>
    <p style={{ marginBottom: '24px' }}>
      Your AI-powered sales development representative that works 24/7. 
      It discovers leads, sends personalized emails, and books meetings — all automatically.
    </p>
    <div className="checkbox-group">
      <div className="checkbox-item">
        <input type="checkbox" checked readOnly id="check1" />
        <label htmlFor="check1">Discovers leads from Apollo.io automatically</label>
      </div>
      <div className="checkbox-item">
        <input type="checkbox" checked readOnly id="check2" />
        <label htmlFor="check2">Writes and sends personalized emails</label>
      </div>
      <div className="checkbox-item">
        <input type="checkbox" checked readOnly id="check3" />
        <label htmlFor="check3">Handles replies and books meetings</label>
      </div>
      <div className="checkbox-item">
        <input type="checkbox" checked readOnly id="check4" />
        <label htmlFor="check4">Runs on autopilot with safety guardrails</label>
      </div>
    </div>
  </div>
)

// Step 2: ICP Configuration
const ICPStep = ({ config, updateConfig }) => (
  <>
    <h2>
      <Target size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
      Define Your Ideal Customer
    </h2>
    <p>Tell your AI SDR who to target</p>

    <div className="form-group">
      <label>Target Industry *</label>
      <select 
        value={config.industry} 
        onChange={(e) => updateConfig('icp', 'industry', e.target.value)}
      >
        <option value="">Select industry...</option>
        <option value="marketing-agency">Marketing Agency</option>
        <option value="saas">SaaS / Software</option>
        <option value="consulting">Consulting / Professional Services</option>
        <option value="ecommerce">E-commerce</option>
        <option value="fintech">FinTech</option>
        <option value="healthcare">Healthcare</option>
        <option value="other">Other</option>
      </select>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>Company Size *</label>
        <select 
          value={config.companySize} 
          onChange={(e) => updateConfig('icp', 'companySize', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="1-10">1-10 employees</option>
          <option value="11-50">11-50 employees</option>
          <option value="51-200">51-200 employees</option>
          <option value="201-500">201-500 employees</option>
          <option value="500+">500+ employees</option>
        </select>
      </div>
      <div className="form-group">
        <label>Location</label>
        <select 
          value={config.location} 
          onChange={(e) => updateConfig('icp', 'location', e.target.value)}
        >
          <option value="">Select...</option>
          <option value="uk">United Kingdom</option>
          <option value="us">United States</option>
          <option value="europe">Europe</option>
          <option value="global">Global</option>
        </select>
      </div>
    </div>

    <div className="form-group">
      <label>Target Job Titles</label>
      <input 
        type="text" 
        placeholder="e.g., CEO, Head of Sales, Marketing Director (comma separated)"
        value={config.jobTitles}
        onChange={(e) => updateConfig('icp', 'jobTitles', e.target.value)}
      />
    </div>

    <div className="form-group">
      <label>Pain Points to Address</label>
      <textarea 
        rows="3"
        placeholder="What problems does your prospect have? e.g., Can't scale outreach, SDR turnover is high..."
        value={config.painPoints}
        onChange={(e) => updateConfig('icp', 'painPoints', e.target.value)}
      />
    </div>
  </>
)

// Step 3: Platform Keys
const PlatformStep = ({ config, updateConfig }) => (
  <>
    <h2>
      <Key size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
      Connect Your Platforms
    </h2>
    <p>Your AI SDR needs access to these tools</p>

    <div className="form-group">
      <label>Apollo.io API Key *</label>
      <input 
        type="password" 
        className="api-key-input"
        placeholder="apollo_key_xxxx"
        value={config.apolloKey}
        onChange={(e) => updateConfig('platforms', 'apolloKey', e.target.value)}
      />
      <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
        For lead discovery and enrichment
      </p>
    </div>

    <div className="form-group">
      <label>OpenAI API Key *</label>
      <input 
        type="password" 
        className="api-key-input"
        placeholder="sk-..."
        value={config.openaiKey}
        onChange={(e) => updateConfig('platforms', 'openaiKey', e.target.value)}
      />
      <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
        For writing personalized emails
      </p>
    </div>

    <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-card)', borderRadius: '8px' }}>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
        Optional: For email sending and calendar booking
      </p>
      
      <div className="form-group">
        <label>Nylas Client ID</label>
        <input 
          type="password" 
          className="api-key-input"
          placeholder="nylas_client_id"
          value={config.nylasClientId}
          onChange={(e) => updateConfig('platforms', 'nylasClientId', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Nylas Client Secret</label>
        <input 
          type="password" 
          className="api-key-input"
          placeholder="nylas_secret"
          value={config.nylasSecret}
          onChange={(e) => updateConfig('platforms', 'nylasSecret', e.target.value)}
        />
      </div>
    </div>

    <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-card)', borderRadius: '8px' }}>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
        Optional: For data storage
      </p>
      
      <div className="form-group">
        <label>Supabase URL</label>
        <input 
          type="text" 
          placeholder="https://your-project.supabase.co"
          value={config.supabaseUrl}
          onChange={(e) => updateConfig('platforms', 'supabaseUrl', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Supabase Service Key</label>
        <input 
          type="password" 
          className="api-key-input"
          placeholder="eyJ..."
          value={config.supabaseKey}
          onChange={(e) => updateConfig('platforms', 'supabaseKey', e.target.value)}
        />
      </div>
    </div>
  </>
)

// Step 4: First Campaign
const CampaignStep = ({ config, updateConfig }) => (
  <>
    <h2>
      <Rocket size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
      Launch Your First Campaign
    </h2>
    <p>Configure how your AI SDR will work</p>

    <div className="form-group">
      <label>Campaign Name</label>
      <input 
        type="text" 
        value={config.name}
        onChange={(e) => updateConfig('firstCampaign', 'name', e.target.value)}
      />
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>Daily Email Limit</label>
        <select 
          value={config.dailyLimit} 
          onChange={(e) => updateConfig('firstCampaign', 'dailyLimit', parseInt(e.target.value))}
        >
          <option value={25}>25 emails/day (safe start)</option>
          <option value={50}>50 emails/day (recommended)</option>
          <option value={100}>100 emails/day (established)</option>
          <option value={200}>200 emails/day (high volume)</option>
        </select>
      </div>
      <div className="form-group">
        <label>Follow-up Sequence</label>
        <select 
          value={config.sequenceSteps} 
          onChange={(e) => updateConfig('firstCampaign', 'sequenceSteps', parseInt(e.target.value))}
        >
          <option value={3}>3 touch sequence</option>
          <option value={4}>4 touch sequence</option>
          <option value={5}>5 touch sequence</option>
        </select>
      </div>
    </div>

    <div className="checkbox-group mt-4">
      <div className="checkbox-item">
        <input type="checkbox" checked readOnly id="safety1" />
        <label htmlFor="safety1">Never exceed daily send limits</label>
      </div>
      <div className="checkbox-item">
        <input type="checkbox" checked readOnly id="safety2" />
        <label htmlFor="safety2">Never contact same person twice</label>
      </div>
      <div className="checkbox-item">
        <input type="checkbox" checked readOnly id="safety3" />
        <label htmlFor="safety3">Pause if bounce rate exceeds 5%</label>
      </div>
      <div className="checkbox-item">
        <input type="checkbox" checked readOnly id="safety4" />
        <label htmlFor="safety4">Only send during business hours</label>
      </div>
    </div>

    <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0, 217, 163, 0.1)', borderRadius: '8px', border: '1px solid var(--accent-success)' }}>
      <p style={{ fontSize: '14px', color: 'var(--accent-success)' }}>
        <Check size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Your AI SDR will start automatically once you click "Launch"
      </p>
    </div>
  </>
)

export default SetupWizard
