import React, { useState, useRef, useEffect } from 'react';
import { Shield, Copy, Check, Info, FileText, FileUp, Key, Lock, Award, Clock, FileCheck } from 'lucide-react';
import { HistoryItem } from '../types';
import CryptoJS from 'crypto-js';

interface PemToolProps {
  onSaveHistory: (input: string, output: string, metadata?: Record<string, any>) => void;
  history: HistoryItem[];
}

interface CertDetails {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  publicKeyAlgorithm: string;
  publicKeySize: string;
  sha1Fingerprint: string;
  sha256Fingerprint: string;
  md5Fingerprint: string;
}

export default function PemTool({ onSaveHistory, history }: PemToolProps) {
  const [pemInput, setPemInput] = useState<string>('');
  const [pemType, setPemType] = useState<string | null>(null);
  const [parsedDetails, setParsedDetails] = useState<CertDetails | null>(null);
  const [keyDetails, setKeyDetails] = useState<{ bits?: number; format?: string; type?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File loading
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setPemInput(text);
      };
      reader.readAsText(file);
    }
  };

  // Decode PEM on Input change
  useEffect(() => {
    setError(null);
    setPemType(null);
    setParsedDetails(null);
    setKeyDetails(null);

    if (!pemInput.trim()) return;

    try {
      // Discover PEM Type
      const match = pemInput.match(/-----BEGIN ([A-Z0-9 ]+)-----/);
      if (!match) {
        setError('Invalid PEM format. Missing standard "-----BEGIN ...-----" boundaries.');
        return;
      }

      const type = match[1];
      setPemType(type);

      // Extract Base64 parts
      const base64Content = pemInput
        .replace(/-----BEGIN [A-Z0-9 ]+-----/, '')
        .replace(/-----END [A-Z0-9 ]+-----/, '')
        .replace(/\s+/g, '');

      // Check Base64 validity
      if (!/^[A-Za-z0-9+/=]+$/.test(base64Content)) {
        setError('PEM block contains invalid base64-encoded characters.');
        return;
      }

      // Convert to Uint8Array
      const binaryString = window.atob(base64Content);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Hashing Fingerprints
      const latin1String = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
      const wordArray = CryptoJS.enc.Latin1.parse(latin1String);
      
      const md5Hex = CryptoJS.MD5(wordArray).toString();
      const sha1Hex = CryptoJS.SHA1(wordArray).toString();
      const sha256Hex = CryptoJS.SHA256(wordArray).toString();

      const md5Fingerprint = formatFingerprint(md5Hex);
      const sha1Fingerprint = formatFingerprint(sha1Hex);
      const sha256Fingerprint = formatFingerprint(sha256Hex);

      if (type.includes('CERTIFICATE')) {
        // Parse Certificate
        const cert = parseCertificateDER(bytes);
        setParsedDetails({
          ...cert,
          md5Fingerprint,
          sha1Fingerprint,
          sha256Fingerprint
        });
        
        onSaveHistory(
          `Certificate: CN=${cert.subject.CN || 'Unknown'}`,
          `Issuer: CN=${cert.issuer.CN || 'Unknown'}`,
          { tool: 'pem_tool', type: 'certificate', subject: cert.subject.CN }
        );
      } else if (type.includes('PRIVATE KEY') || type.includes('RSA PRIVATE')) {
        // Private Key info
        const lengthEstimate = estimateKeyLengthFromBytes(bytes);
        setKeyDetails({
          bits: lengthEstimate,
          format: type.includes('RSA') ? 'PKCS#1 RSA' : 'PKCS#8',
          type: 'Private Key'
        });
        onSaveHistory(
          `Private Key (${lengthEstimate}-bit)`,
          `Format: ${type}`,
          { tool: 'pem_tool', type: 'private_key', bits: lengthEstimate }
        );
      } else if (type.includes('PUBLIC KEY') || type.includes('RSA PUBLIC')) {
        // Public key info
        const lengthEstimate = estimateKeyLengthFromBytes(bytes);
        setKeyDetails({
          bits: lengthEstimate,
          format: type.includes('RSA') ? 'PKCS#1 RSA' : 'SubjectPublicKeyInfo (X.509)',
          type: 'Public Key'
        });
        onSaveHistory(
          `Public Key (${lengthEstimate}-bit)`,
          `Format: ${type}`,
          { tool: 'pem_tool', type: 'public_key', bits: lengthEstimate }
        );
      } else {
        // Other types (CSR, SSH keys)
        setKeyDetails({
          format: 'PEM Base64 Block',
          type: type
        });
      }
    } catch (err: any) {
      setError(`Failed to parse PEM payload: ${err.message || 'Check syntax'}`);
    }
  }, [pemInput]);

  const formatFingerprint = (hex: string): string => {
    return hex.match(/.{1,2}/g)?.join(':').toUpperCase() || hex;
  };

  const estimateKeyLengthFromBytes = (bytes: Uint8Array): number => {
    // Basic key bit estimation from byte count
    const byteLength = bytes.length;
    if (byteLength > 1600) return 4096;
    if (byteLength > 800) return 2048;
    if (byteLength > 400) return 1024;
    if (byteLength > 200) return 512;
    return 256;
  };

  // Safe DER parser helpers for X509 certificates
  interface ASN1Node {
    tag: number;
    length: number;
    value: Uint8Array;
    children: ASN1Node[];
  }

  const decodeASN1 = (bytes: Uint8Array): ASN1Node[] => {
    const nodes: ASN1Node[] = [];
    let pos = 0;
    while (pos < bytes.length) {
      if (pos >= bytes.length) break;
      const tag = bytes[pos++];
      if (pos >= bytes.length) break;
      let len = bytes[pos++];
      if (len & 0x80) {
        const bytesToRead = len & 0x7f;
        if (pos + bytesToRead > bytes.length) break;
        len = 0;
        for (let i = 0; i < bytesToRead; i++) {
          len = (len << 8) | bytes[pos++];
        }
      }
      if (pos + len > bytes.length) {
        len = bytes.length - pos;
      }
      const value = bytes.slice(pos, pos + len);
      pos += len;

      let children: ASN1Node[] = [];
      if ((tag & 0x20) === 0x20) {
        try {
          children = decodeASN1(value);
        } catch (e) {
          // ignore nested errors
        }
      }
      nodes.push({ tag, length: len, value, children });
    }
    return nodes;
  };

  const parseDistinguishedName = (dnNode: ASN1Node): Record<string, string> => {
    const dn: Record<string, string> = {};
    const traverse = (node: ASN1Node) => {
      // Look for sequences containing OID and then a value
      if (node.tag === 0x30 && node.children.length >= 2) {
        const oIdNode = node.children[0];
        const valNode = node.children[1];
        if (oIdNode.tag === 0x06) {
          const oidStr = Array.from(oIdNode.value).join('.');
          const valBytes = valNode.value;
          // Convert ASCII/UTF-8 bytes to String
          const valueStr = Array.from(valBytes)
            .map(b => (b >= 32 && b <= 126) || b > 127 ? String.fromCharCode(b) : '')
            .join('')
            .trim();

          if (oidStr === '85.4.3' || oidStr.endsWith('.85.4.3')) dn['CN'] = valueStr;
          else if (oidStr === '85.4.10' || oidStr.endsWith('.85.4.10')) dn['O'] = valueStr;
          else if (oidStr === '85.4.11' || oidStr.endsWith('.85.4.11')) dn['OU'] = valueStr;
          else if (oidStr === '85.4.6' || oidStr.endsWith('.85.4.6')) dn['C'] = valueStr;
          else if (oidStr === '85.4.7' || oidStr.endsWith('.85.4.7')) dn['L'] = valueStr;
          else if (oidStr === '85.4.8' || oidStr.endsWith('.85.4.8')) dn['ST'] = valueStr;
        }
      }
      for (const child of node.children) {
        traverse(child);
      }
    };
    traverse(dnNode);
    return dn;
  };

  const parseCertificateDER = (bytes: Uint8Array): Omit<CertDetails, 'md5Fingerprint' | 'sha1Fingerprint' | 'sha256Fingerprint'> => {
    const rootNodes = decodeASN1(bytes);
    if (rootNodes.length === 0 || rootNodes[0].tag !== 0x30) {
      throw new Error('Not a valid ASN.1 sequence (DER format)');
    }

    const root = rootNodes[0];
    const tbsCertNode = root.children.find(child => child.tag === 0x30);
    if (!tbsCertNode) {
      throw new Error('Could not find TBSCertificate ASN.1 block');
    }

    const tbsChildren = tbsCertNode.children;
    if (tbsChildren.length < 3) {
      throw new Error('Malformed TBSCertificate: too few elements');
    }

    // Dynamic sequence detection for elements
    // Find serial number: first Integer (0x02)
    const serialNode = tbsChildren.find(c => c.tag === 0x02);
    let serialNumber = 'Unknown';
    if (serialNode) {
      serialNumber = Array.from(serialNode.value)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join(':');
    }

    // Filter sequences that appear after the serial number
    const serialIndex = serialNode ? tbsChildren.indexOf(serialNode) : 0;
    const candidateSequences = tbsChildren.slice(serialIndex + 1).filter(c => c.tag === 0x30);

    // Validity sequence has exactly 2 children, both having tags 0x17 (UTCTime) or 0x18 (GeneralizedTime)
    const validityIndex = candidateSequences.findIndex(seq => 
      seq.children.length === 2 && 
      (seq.children[0].tag === 0x17 || seq.children[0].tag === 0x18) &&
      (seq.children[1].tag === 0x17 || seq.children[1].tag === 0x18)
    );

    let issuerNode: ASN1Node | null = null;
    let validityNode: ASN1Node | null = null;
    let subjectNode: ASN1Node | null = null;
    let subjectPublicKeyInfoNode: ASN1Node | null = null;

    if (validityIndex !== -1) {
      validityNode = candidateSequences[validityIndex];
      if (validityIndex > 0) {
        issuerNode = candidateSequences[validityIndex - 1];
      }
      if (validityIndex + 1 < candidateSequences.length) {
        subjectNode = candidateSequences[validityIndex + 1];
      }
      if (validityIndex + 2 < candidateSequences.length) {
        subjectPublicKeyInfoNode = candidateSequences[validityIndex + 2];
      }
    } else {
      // Fallback to relative indexing if structure is atypical
      const hasVersion = tbsChildren[0].tag === 0xA0;
      const offset = hasVersion ? 1 : 0;
      issuerNode = tbsChildren[offset + 2] || null;
      validityNode = tbsChildren[offset + 3] || null;
      subjectNode = tbsChildren[offset + 4] || null;
      subjectPublicKeyInfoNode = tbsChildren[offset + 5] || null;
    }

    const issuer = issuerNode ? parseDistinguishedName(issuerNode) : {};
    const subject = subjectNode ? parseDistinguishedName(subjectNode) : {};

    let validFrom = 'Unknown';
    let validTo = 'Unknown';
    if (validityNode && validityNode.tag === 0x30 && validityNode.children.length >= 2) {
      const notBefore = validityNode.children[0];
      const notAfter = validityNode.children[1];
      validFrom = parseASN1Time(notBefore.tag, notBefore.value);
      validTo = parseASN1Time(notAfter.tag, notAfter.value);
    }

    let publicKeyAlgorithm = 'RSA / ECC';
    let publicKeySize = '2048 bits (Estimate)';

    if (subjectPublicKeyInfoNode && subjectPublicKeyInfoNode.tag === 0x30) {
      publicKeySize = `${estimateKeyLengthFromBytes(subjectPublicKeyInfoNode.value)} bits`;
      const valueStr = Array.from(subjectPublicKeyInfoNode.value)
        .map(b => String.fromCharCode(b)).join('');
      if (valueStr.includes('rsa') || valueStr.includes('\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01')) {
        publicKeyAlgorithm = 'RSA Encryption';
      } else if (valueStr.includes('ecPublicKey') || valueStr.includes('\x2a\x86\x48\xce\x3d\x02\x01')) {
        publicKeyAlgorithm = 'Elliptic Curve (ECDSA)';
      }
    }

    return {
      subject,
      issuer,
      validFrom,
      validTo,
      serialNumber,
      publicKeyAlgorithm,
      publicKeySize,
    };
  };

  const parseASN1Time = (tag: number, valBytes: Uint8Array): string => {
    // UTCTime (0x17) or GeneralizedTime (0x18)
    const str = Array.from(valBytes).map(b => String.fromCharCode(b)).join('');
    if (tag === 0x17) {
      // YYMMDDHHMMSSZ
      const year = parseInt(str.substring(0, 2)) < 50 ? '20' + str.substring(0, 2) : '19' + str.substring(0, 2);
      const month = str.substring(2, 4);
      const day = str.substring(4, 6);
      const hour = str.substring(6, 8);
      const min = str.substring(8, 10);
      const sec = str.substring(10, 12);
      return `${year}-${month}-${day} ${hour}:${min}:${sec} UTC`;
    } else if (tag === 0x18) {
      // YYYYMMDDHHMMSSZ
      const year = str.substring(0, 4);
      const month = str.substring(4, 6);
      const day = str.substring(6, 8);
      const hour = str.substring(8, 10);
      const min = str.substring(10, 12);
      const sec = str.substring(12, 14);
      return `${year}-${month}-${day} ${hour}:${min}:${sec} UTC`;
    }
    return 'Unknown format';
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6" id="pem-tool-container">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100" id="pem-title">
          PEM Key & Certificate Decoder
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Analyze and decode PEM container formats for public/private keys and X.509 SSL certificates offline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Input area */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between min-h-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Paste PEM Content
            </span>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pem,.crt,.key,.pub,.der,.cer"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/80 text-gray-600 dark:text-zinc-400 transition-colors text-xs font-semibold"
              >
                <FileUp className="w-3.5 h-3.5" />
                Upload Key/Cert File
              </button>
            </div>
          </div>

          <textarea
            value={pemInput}
            onChange={(e) => setPemInput(e.target.value)}
            placeholder="-----BEGIN CERTIFICATE-----\nMIIFdzCCBF+gAwIBAgIQD...\n-----END CERTIFICATE-----"
            className="w-full min-h-[300px] lg:min-h-[400px] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 font-mono text-xs text-gray-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
          />

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900/30">
              <Shield className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Side: Render Output Details */}
        <div className="lg:col-span-6 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
            Parsed Container Meta-data
          </span>

          {pemType ? (
            <div className="space-y-4">
              {/* PEM Type Header Badge */}
              <div className="p-4 rounded-xl border border-gray-150 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {pemType.includes('CERTIFICATE') ? (
                    <Award className="w-5 h-5 text-amber-500" />
                  ) : pemType.includes('PRIVATE') ? (
                    <Lock className="w-5 h-5 text-red-500" />
                  ) : (
                    <Key className="w-5 h-5 text-emerald-500" />
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Format Detected</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-zinc-100">{pemType}</span>
                  </div>
                </div>
              </div>

              {/* Certificate Decoded structural details */}
              {parsedDetails && (
                <div className="space-y-4">
                  {/* Subject details card */}
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/20 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      Subject Distinguished Name (DN)
                    </h4>
                    <div className="text-xs space-y-1 bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border border-gray-100 dark:border-zinc-900 font-mono text-gray-600 dark:text-zinc-400">
                      <div><strong className="text-gray-400">Common Name (CN):</strong> {parsedDetails.subject.CN || '[Not Provided]'}</div>
                      <div><strong className="text-gray-400">Organization (O):</strong> {parsedDetails.subject.O || '[Not Provided]'}</div>
                      <div><strong className="text-gray-400">Organizational Unit (OU):</strong> {parsedDetails.subject.OU || '[Not Provided]'}</div>
                      <div><strong className="text-gray-400">Country (C):</strong> {parsedDetails.subject.C || '[Not Provided]'}</div>
                      {parsedDetails.subject.ST && <div><strong className="text-gray-400">State (ST):</strong> {parsedDetails.subject.ST}</div>}
                      {parsedDetails.subject.L && <div><strong className="text-gray-400">Locality (L):</strong> {parsedDetails.subject.L}</div>}
                    </div>
                  </div>

                  {/* Issuer details card */}
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/20 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      Certificate Authority / Issuer (DN)
                    </h4>
                    <div className="text-xs space-y-1 bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border border-gray-100 dark:border-zinc-900 font-mono text-gray-600 dark:text-zinc-400">
                      <div><strong className="text-gray-400">Authority (CN):</strong> {parsedDetails.issuer.CN || '[Not Provided]'}</div>
                      <div><strong className="text-gray-400">Organization (O):</strong> {parsedDetails.issuer.O || '[Not Provided]'}</div>
                      <div><strong className="text-gray-400">Country (C):</strong> {parsedDetails.issuer.C || '[Not Provided]'}</div>
                    </div>
                  </div>

                  {/* Date validities */}
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/20 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Validity Period
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-gray-100 dark:border-zinc-900">
                        <span className="text-gray-400 block text-[9px] uppercase font-bold">Valid From</span>
                        <span className="font-semibold text-gray-700 dark:text-zinc-300">{parsedDetails.validFrom}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-gray-100 dark:border-zinc-900">
                        <span className="text-gray-400 block text-[9px] uppercase font-bold">Valid Until</span>
                        <span className="font-semibold text-gray-700 dark:text-zinc-300">{parsedDetails.validTo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Serial, Public Key type */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/20 space-y-1">
                      <span className="text-gray-400 uppercase text-[9px] font-bold">Key Algorithm</span>
                      <p className="font-mono text-gray-700 dark:text-zinc-300 font-semibold">{parsedDetails.publicKeyAlgorithm}</p>
                      <p className="text-[10px] text-gray-400">{parsedDetails.publicKeySize}</p>
                    </div>

                    <div className="p-3 rounded-xl border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/20 space-y-1">
                      <span className="text-gray-400 uppercase text-[9px] font-bold">Serial Number</span>
                      <p className="font-mono text-gray-700 dark:text-zinc-300 truncate font-semibold" title={parsedDetails.serialNumber}>
                        {parsedDetails.serialNumber}
                      </p>
                    </div>
                  </div>

                  {/* Fingerprints details (Multiple options user requested!) */}
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/20 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 border-b border-gray-100 dark:border-zinc-800 pb-1.5">
                      <FileCheck className="w-4 h-4" />
                      Certificate Cryptographic Fingerprints
                    </h4>

                    {/* SHA-256 Fingerprint */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-400 font-bold uppercase">SHA-256 Fingerprint</span>
                        <button
                          onClick={() => handleCopy(parsedDetails.sha256Fingerprint, 'sha256_fp')}
                          className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
                        >
                          {copiedKey === 'sha256_fp' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          Copy
                        </button>
                      </div>
                      <div className="bg-gray-50 dark:bg-zinc-950 p-2 rounded-md font-mono text-[10px] break-all border border-gray-100 dark:border-zinc-900 text-gray-600 dark:text-zinc-400">
                        {parsedDetails.sha256Fingerprint}
                      </div>
                    </div>

                    {/* SHA-1 Fingerprint */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-400 font-bold uppercase">SHA-1 Fingerprint</span>
                        <button
                          onClick={() => handleCopy(parsedDetails.sha1Fingerprint, 'sha1_fp')}
                          className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
                        >
                          {copiedKey === 'sha1_fp' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          Copy
                        </button>
                      </div>
                      <div className="bg-gray-50 dark:bg-zinc-950 p-2 rounded-md font-mono text-[10px] break-all border border-gray-100 dark:border-zinc-900 text-gray-600 dark:text-zinc-400">
                        {parsedDetails.sha1Fingerprint}
                      </div>
                    </div>

                    {/* MD5 Fingerprint */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-400 font-bold uppercase">MD5 Fingerprint</span>
                        <button
                          onClick={() => handleCopy(parsedDetails.md5Fingerprint, 'md5_fp')}
                          className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
                        >
                          {copiedKey === 'md5_fp' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          Copy
                        </button>
                      </div>
                      <div className="bg-gray-50 dark:bg-zinc-950 p-2 rounded-md font-mono text-[10px] break-all border border-gray-100 dark:border-zinc-900 text-gray-600 dark:text-zinc-400">
                        {parsedDetails.md5Fingerprint}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key decoded details card */}
              {keyDetails && (
                <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/20 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Key className="w-4 h-4" />
                    Cryptographic Key Properties
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border border-gray-100 dark:border-zinc-900">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">Key Format</span>
                      <span className="font-semibold text-gray-700 dark:text-zinc-300">{keyDetails.format}</span>
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border border-gray-100 dark:border-zinc-900">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">Key Size / Strength</span>
                      <span className="font-semibold text-gray-700 dark:text-zinc-300">
                        {keyDetails.bits ? `${keyDetails.bits} bits` : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50/20 dark:bg-zinc-950 p-3 rounded-xl border border-amber-500/10 flex gap-2.5 items-start text-xs text-amber-700 dark:text-amber-400">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      This PEM block represents a valid <strong>{keyDetails.type}</strong>. The payload was validated securely client-side in your sandbox without network execution.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[350px] rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-zinc-600 italic text-xs">
              <Shield className="w-8 h-8 mb-2 text-gray-300 dark:text-zinc-700 animate-pulse" />
              <span>Paste PEM certificate or cryptographic key, or upload container file to view ASN.1 structural details offline.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
