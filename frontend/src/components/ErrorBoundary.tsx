import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                    <div className="card shadow-lg" style={{ maxWidth: '500px' }}>
                        <div className="card-body text-center p-5">
                            <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '4rem' }}></i>
                            <h2 className="mt-4 mb-3">Oops! Something went wrong</h2>
                            <p className="text-muted mb-4">
                                We encountered an unexpected error. Don't worry, your data is safe.
                            </p>
                            {this.state.error && (
                                <div className="alert alert-danger text-start mb-4">
                                    <small><strong>Error:</strong> {this.state.error.message}</small>
                                </div>
                            )}
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={this.handleReset}
                            >
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
