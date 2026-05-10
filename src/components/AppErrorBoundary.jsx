import React from "react";
import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-[#FAF9F6] px-6 py-12 text-[#2C2A29]">
          <h1 className="font-serif text-4xl">Nomade Project</h1>
          <p className="mt-5 max-w-2xl font-serif text-xl leading-8 text-[#5F5A55]">
            La aplicacion cargo, pero React encontro un problema al renderizar esta vista.
          </p>
          <pre className="mt-8 whitespace-pre-wrap border border-[#E5E2DE] p-5 font-sans text-sm text-[#2C2A29]">
            {this.state.error.message}
          </pre>
        </main>
      );
    }

    return this.props.children;
  }
}
