import type { CaseGraph, GraphEdge, GraphEdgeKind, GraphNode, GraphNodeType } from '../types'

function node(
  id: string,
  type: GraphNodeType,
  label: string,
  sublabel: string,
  layer: number,
  revealedAtStep: number,
  opts: { suspicious?: boolean; attributes?: Record<string, string> } = {},
): GraphNode {
  return {
    id,
    type,
    label,
    sublabel,
    layer,
    revealedAtStep,
    suspicious: opts.suspicious ?? false,
    attributes: opts.attributes ?? {},
  }
}

let edgeCounter = 0
function edge(
  source: string,
  target: string,
  kind: GraphEdgeKind,
  revealedAtStep: number,
  opts: { suspicious?: boolean; label?: string } = {},
): GraphEdge {
  edgeCounter += 1
  return {
    id: `E-${edgeCounter}`,
    source,
    target,
    kind,
    revealedAtStep,
    suspicious: opts.suspicious ?? false,
    label: opts.label,
  }
}

const graph1001: CaseGraph = {
  nodes: [
    node('D555', 'device', 'D555', 'Android 13', 0, 4, {
      suspicious: true,
      attributes: { 'Cards seen': '14', 'First seen': '08 Oct 14:02', 'Accounts linked': '1' },
    }),
    node('C-1190', 'customer', 'C-1190', 'Neha Kulkarni', 0, 1, {
      attributes: { Segment: 'Retail', Tenure: '2.1 years' },
    }),
    node('A-3310', 'account', 'A-3310', 'Primary account', 1, 1, {
      attributes: { Status: 'Active', Cards: '15' },
    }),
    node('K-0231', 'card', '•0231', 'Declined', 2, 2, { suspicious: true, attributes: { Attempts: '3', Declined: '3' } }),
    node('K-0245', 'card', '•0245', 'Declined', 2, 2, { suspicious: true, attributes: { Attempts: '2', Declined: '2' } }),
    node('K-0252', 'card', '•0252', 'Approved ₹1', 2, 2, { suspicious: true, attributes: { Attempts: '2', Declined: '1' } }),
    node('K-MORE', 'card', '+11 cards', 'Same pattern', 2, 4, { suspicious: true, attributes: { Attempts: '27', Declined: '19' } }),
    node('M-102', 'merchant', 'Streamly', 'Digital goods', 3, 1, {
      attributes: { Category: 'Digital subscriptions', Country: 'IN', 'Risk profile': 'Medium' },
    }),
  ],
  edges: [
    edge('C-1190', 'A-3310', 'owns', 1),
    edge('D555', 'A-3310', 'logged_in', 4, { suspicious: true, label: '14 cards' }),
    edge('A-3310', 'K-0231', 'owns', 2),
    edge('A-3310', 'K-0245', 'owns', 2),
    edge('A-3310', 'K-0252', 'owns', 2),
    edge('A-3310', 'K-MORE', 'owns', 4, { suspicious: true }),
    edge('K-0231', 'M-102', 'paid', 3, { suspicious: true, label: '₹1 ×3' }),
    edge('K-0245', 'M-102', 'paid', 3, { suspicious: true, label: '₹1 ×2' }),
    edge('K-0252', 'M-102', 'paid', 3, { suspicious: true, label: '₹1 ×2' }),
    edge('K-MORE', 'M-102', 'paid', 4, { suspicious: true, label: '₹1 ×27' }),
  ],
}

const graph1002: CaseGraph = {
  nodes: [
    node('C-4408', 'customer', 'C-4408', 'Rohan Desai', 0, 1, { attributes: { Segment: 'Affluent', Tenure: '5.4 years' } }),
    node('A-2204', 'account', 'A-2204', 'Primary account', 1, 1, { attributes: { Status: 'Active' } }),
    node('D014', 'device', 'D014', 'iPhone 14', 2, 2, { attributes: { 'First seen': '2024-02-11', Logins: '212' } }),
    node('D774', 'device', 'D774', 'Windows Chrome', 2, 4, {
      suspicious: true,
      attributes: { 'First seen': '08 Oct 02:41', Logins: '1', 'Accounts linked': '3' },
    }),
    node('TXN-50188', 'transaction', 'TXN-50188', '₹72,500', 2, 1, { attributes: { Status: 'Flagged' } }),
    node('M-871', 'merchant', 'GiftCardHub', 'Gift cards', 3, 3, {
      suspicious: true,
      attributes: { Category: 'Gift cards', Country: 'SG', 'Risk profile': 'High' },
    }),
  ],
  edges: [
    edge('C-4408', 'A-2204', 'owns', 1),
    edge('A-2204', 'D014', 'uses', 2, { label: '212 logins' }),
    edge('A-2204', 'D774', 'logged_in', 4, { suspicious: true, label: '1 login' }),
    edge('A-2204', 'TXN-50188', 'paid', 1),
    edge('TXN-50188', 'M-871', 'paid', 3, { suspicious: true, label: '₹72,500' }),
  ],
}

const graph1003: CaseGraph = {
  nodes: [
    node('A-8101', 'account', 'A-8101', 'Sender', 0, 1, { attributes: { Role: 'Inbound sender' } }),
    node('A-8117', 'account', 'A-8117', 'Sender', 0, 5, { attributes: { Role: 'Inbound sender' } }),
    node('A-8123', 'account', 'A-8123', 'Sender', 0, 5, { attributes: { Role: 'Inbound sender' } }),
    node('A-5520', 'account', 'A-5520', 'Recipient', 1, 1, {
      suspicious: true,
      attributes: { 'Account age': '19 days', 'Pass-through': '96%', 'Median hold': '9 min' },
    }),
    node('A-6001', 'account', 'A-6001', 'Onward hop 1', 2, 5, { suspicious: true, attributes: { 'Account age': '11 days' } }),
    node('A-6002', 'account', 'A-6002', 'Onward hop 1', 2, 5, { suspicious: true, attributes: { 'Account age': '14 days' } }),
    node('A-6101', 'account', 'A-6101', 'Cash-out', 3, 6, { suspicious: true, attributes: { 'Account age': '6 days', Channel: 'ATM withdrawals' } }),
  ],
  edges: [
    edge('A-8101', 'A-5520', 'transferred', 1, { label: '₹31,000' }),
    edge('A-8117', 'A-5520', 'transferred', 5, { suspicious: true, label: '₹18,500' }),
    edge('A-8123', 'A-5520', 'transferred', 5, { suspicious: true, label: '₹22,000' }),
    edge('A-5520', 'A-6001', 'transferred', 5, { suspicious: true, label: '₹34,000 · 8m' }),
    edge('A-5520', 'A-6002', 'transferred', 5, { suspicious: true, label: '₹35,500 · 11m' }),
    edge('A-6001', 'A-6101', 'transferred', 6, { suspicious: true, label: '₹33,200' }),
    edge('A-6002', 'A-6101', 'transferred', 6, { suspicious: true, label: '₹34,800' }),
  ],
}

const graph1004: CaseGraph = {
  nodes: [
    node('C-3012', 'customer', 'C-3012', 'Meera Iyer', 0, 1, { attributes: { Segment: 'Frequent traveller', Tenure: '7.2 years' } }),
    node('A-1180', 'account', 'A-1180', 'Primary account', 1, 1, { attributes: { Status: 'Active' } }),
    node('D014', 'device', 'D014', 'iPhone 15', 2, 2, { attributes: { 'First seen': '2023-06-03', Logins: '540' } }),
    node('D201', 'device', 'D201', 'iPad (new)', 2, 4, {
      attributes: { 'First seen': '08 Oct 09:14', Logins: '2', 'Accounts linked': '1' },
    }),
    node('K-9917', 'card', '•9917', 'Primary card', 2, 1, { attributes: { Type: 'Credit' } }),
    node('M-440', 'merchant', 'Heathrow Duty Free', 'Retail · GB', 3, 3, {
      attributes: { Category: 'Duty free', Country: 'GB', 'Risk profile': 'Low' },
    }),
  ],
  edges: [
    edge('C-3012', 'A-1180', 'owns', 1),
    edge('A-1180', 'D014', 'uses', 2, { label: '540 logins' }),
    edge('A-1180', 'D201', 'logged_in', 4, { label: '2 logins' }),
    edge('A-1180', 'K-9917', 'owns', 1),
    edge('K-9917', 'M-440', 'paid', 3, { label: '₹21,400' }),
  ],
}

const graph1005: CaseGraph = {
  nodes: [
    node('C-2231', 'customer', 'C-2231', 'Aarav Mehta', 0, 1, { attributes: { Segment: 'Retail', Tenure: '3.4 years' } }),
    node('A-7741', 'account', 'A-7741', 'Primary account', 1, 1, { attributes: { Status: 'Active' } }),
    node('D014', 'device', 'D014', 'Pixel 7', 2, 2, { attributes: { 'First seen': '2023-05-19', Logins: '188' } }),
    node('D981', 'device', 'D981', 'Windows Chrome', 2, 4, {
      suspicious: true,
      attributes: { 'First seen': '08 Oct 03:12', Logins: '1', 'Accounts linked': '4' },
    }),
    node('K-4417', 'card', '•4417', 'Primary card', 2, 1, { attributes: { Type: 'Debit' } }),
    node('TXN-50291', 'transaction', 'TXN-50291', '₹48,000', 2, 1, { attributes: { Status: 'Flagged', Channel: 'Bank transfer' } }),
    node('A-9902', 'account', 'A-9902', 'Recipient', 3, 5, {
      suspicious: true,
      attributes: { 'Account age': '17 days', 'Pass-through': '97%', 'Median hold': '14 min' },
    }),
    node('A-9913', 'account', 'A-9913', 'Onward', 4, 6, { suspicious: true, attributes: { 'Account age': '9 days' } }),
    node('A-9927', 'account', 'A-9927', 'Onward', 4, 6, { suspicious: true, attributes: { 'Account age': '12 days' } }),
    node('A-9935', 'account', 'A-9935', 'Onward', 4, 6, { suspicious: true, attributes: { 'Account age': '5 days' } }),
  ],
  edges: [
    edge('C-2231', 'A-7741', 'owns', 1),
    edge('A-7741', 'K-4417', 'owns', 1),
    edge('A-7741', 'D014', 'uses', 2, { label: '188 logins' }),
    edge('A-7741', 'D981', 'logged_in', 4, { suspicious: true, label: '1 login' }),
    edge('A-7741', 'TXN-50291', 'paid', 1),
    edge('TXN-50291', 'A-9902', 'transferred', 5, { suspicious: true, label: '₹48,000' }),
    edge('A-9902', 'A-9913', 'transferred', 6, { suspicious: true, label: '₹15,200 · 6m' }),
    edge('A-9902', 'A-9927', 'transferred', 6, { suspicious: true, label: '₹16,400 · 11m' }),
    edge('A-9902', 'A-9935', 'transferred', 6, { suspicious: true, label: '₹14,900 · 14m' }),
  ],
}

export const GRAPHS: Record<string, CaseGraph> = {
  'CASE-1001': graph1001,
  'CASE-1002': graph1002,
  'CASE-1003': graph1003,
  'CASE-1004': graph1004,
  'CASE-1005': graph1005,
  'CASE-1006': graph1001,
  'CASE-1007': graph1004,
  'CASE-1008': graph1002,
}
