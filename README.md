# DevForge Utilities

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-sharp)](https://github.com/loganathan-sekaran/devforge-utilities/pulls)
[![GitHub Issues](https://img.shields.io/github/issues/loganathan-sekaran/devforge-utilities.svg)](https://github.com/loganathan-sekaran/devforge-utilities/issues)
[![GitHub Stars](https://img.shields.io/github/stars/loganathan-sekaran/devforge-utilities.svg)](https://github.com/loganathan-sekaran/devforge-utilities/stargazers)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/loganathan-sekaran/devforge-utilities)

DevForge Utilities is a highly polished, browser-based, interactive swiss-army knife designed for web developers, security engineers, and DevOps professionals. It provides a rich set of utility tools grouped into data formatters, encoders, security decoders, text tools, and network client utilities.

Built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**, DevForge is completely lightweight, super-fast, responsive, and secure.

---

## 🔒 Security & Privacy First

**All operations are executed 100% client-side inside your browser sandbox.** 
None of your payloads, private keys, JWTs, or API parameters are ever sent to, processed by, or stored on any server. You can use DevForge in complete offline environments with total confidence that your proprietary data remains private.

---

## 🚀 Key Features

### 1. 🌐 Network & API (Postman Alternative & cURL Wizard)
*   **Visual REST API Executor**: Construct and run HTTP requests directly from the browser. Supports headers, query parameters, cookies, and various request body configurations:
    *   `multipart/form-data` with actual file attachments.
    *   `application/x-www-form-urlencoded` fields.
    *   Raw text / JSON.
*   **cURL Generator & Parser**: Seamlessly export requests as standard `curl` terminal commands or paste an existing `curl` statement to import and populate the visual builder instantly.
*   **Cookie inspector**: Attach cookies in requests and view custom cookie properties in response headers.

### 2. 🛡️ Security & Cryptography
*   **PEM Key & Certificate Decoder**: Offline X.509 certificate and private/public key inspector. Extracts Subject DN & Issuer DN details, validity dates, serial numbers, algorithms, and key strengths.
    *   *Multiple fingerprint views*: View and copy SHA-256, SHA-1, and MD5 fingerprints of any certificate.
*   **JWT Token Viewer**: Parse JWT claims, headers, and signature structures offline with clear metadata highlighting.
*   **Hash Generator**: Instant cryptographic hashing supporting MD5, SHA-256, and SHA-512 algorithms.

### 3. 📝 Text & Documentation Utils
*   **Markdown (MD) File Previewer**: Paste or load markdown files and view beautiful styled previews.
    *   Supports **Horizontal** and **Vertical** visual split screens.
*   **Side-by-Side Diff Checker**: Compare two text/code snippets line-by-line with color-coded additions, deletions, and highlight modifications.
*   **Regex Validator & Matcher**: Match PCRE regular expressions on target texts with interactive match counts.
*   **UUID Generator**: Bulk-generate cryptographically secure UUID v4 tokens.

### 4. 🔤 Encoders & Decoders
*   **Base64 Encoder/Decoder**: Encode or decode files and text formats. Includes an **Auto-Conversion** option to translate inputs immediately as you type.
*   **URL Encoder/Decoder**: Percent-encode or decode URL components instantly without manual action.

### 5. 🗄️ History & Background Jobs
*   **Operation logs**: Keep track of previous operations with persistent, fully purgeable browser history logs.
*   **Progressive tasks**: Progress-bar tracker for heavyweight bulk actions.

---

## 🛠️ Local Development

Follow these steps to run the application locally on your machine:

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/loganathan-sekaran/devforge-utilities.git
    cd devforge-utilities
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    The application will launch on port `3000` (or the default Vite configured port).

4.  **Production Build**
    ```bash
    npm run build
    ```
    Creates optimized, production-ready static assets in the `dist/` directory.

---

## 🤝 Contributions & Forking

This project is fully open-source and contributions are welcome! If you'd like to make DevForge even better:

1.  **Fork** the repository.
2.  Create your **feature branch** (`git checkout -b feature/amazing-utility`).
3.  **Commit** your changes (`git commit -m 'Add some amazing utility'`).
4.  **Push** to the branch (`git push origin feature/amazing-utility`).
5.  Open a **Pull Request**.

Feel free to submit an issue for bug reports or feature suggestions [here](https://github.com/loganathan-sekaran/devforge-utilities/issues).

---

## 📄 License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.
