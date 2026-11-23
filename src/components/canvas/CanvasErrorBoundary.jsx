import { Component } from 'react'

export default class CanvasErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Canvas render failed:', error, info)
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="editor-canvas-fallback" role="alert">
          <h3>{this.props.title ?? 'This view could not be rendered.'}</h3>
          <p>{this.state.error.message || 'An unexpected rendering error occurred.'}</p>
          <button type="button" className="editor-action-btn" onClick={this.handleRetry}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
