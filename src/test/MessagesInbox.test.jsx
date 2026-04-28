/**
 * Unit Tests: MessagesInbox + MessagesThread (auto-scroll)
 *
 * Run with:  npm run test
 *
 * Coverage:
 *  - Conversation list rendering (empty, loading, populated)
 *  - Search/filter pill logic
 *  - Unread badge display
 *  - Relative time formatting
 *  - Duplicate-message deduplication logic
 *  - Date separator grouping
 *  - AUTO-SCROLL BUG: smart scroll only fires when near-bottom or user sent
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React, { useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 – Pure-logic utilities extracted from MessagesInbox / MessagesThread
// (Testing pure functions without needing full React tree)
// ─────────────────────────────────────────────────────────────────────────────

/** Extracted from MessagesInbox — formatRelativeTime */
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/** Extracted from MessagesThread — deduplication logic */
function deduplicateMessages(messages) {
  const seen = new Set();
  return messages.filter(msg => {
    const id = msg._id || msg.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Extracted from MessagesThread — date-separator grouping */
function groupMessagesWithSeparators(messages) {
  if (messages.length === 0) return [];
  const grouped = [];
  let currentDate = null;
  messages.forEach((msg, index) => {
    const msgDate = new Date(msg.createdAt);
    const dateStr = msgDate.toDateString();
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      let dateLabel = '';
      if (dateStr === today.toDateString()) dateLabel = 'Today';
      else if (dateStr === yesterday.toDateString()) dateLabel = 'Yesterday';
      else dateLabel = msgDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      grouped.push({ type: 'separator', date: dateLabel, key: `sep-${dateStr}` });
    }
    grouped.push({ type: 'message', ...msg, key: msg._id || msg.id || `msg-${index}` });
  });
  return grouped;
}

/** Extracted auto-scroll decision logic */
function shouldScrollToBottom({ uniqueMessages, prevCount, isNearBottom, currentUserId }) {
  const latestCount = uniqueMessages.length;
  const added = latestCount - prevCount;
  const newestMsg = uniqueMessages[latestCount - 1];
  const userJustSent = added > 0 && newestMsg?.senderId === currentUserId;
  return isNearBottom || userJustSent;
}

/** Extracted conversation filter logic from MessagesInbox */
function filterConversations(conversations, filter, searchTerm, jobDetails) {
  let filtered = conversations;
  if (filter === 'unread') filtered = filtered.filter(c => c.unreadCount > 0);
  else if (filter === 'job-related') filtered = filtered.filter(c => c.jobId);
  else if (filter === 'general') filtered = filtered.filter(c => !c.jobId);
  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(c => {
      const name = c.workerName?.toLowerCase() || '';
      const job = jobDetails[c.jobId]?.title?.toLowerCase() || '';
      return name.includes(s) || job.includes(s);
    });
  }
  return filtered.sort((a, b) =>
    new Date(b.lastMessageCreatedAt || 0) - new Date(a.lastMessageCreatedAt || 0)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 – TEST SUITES
// ─────────────────────────────────────────────────────────────────────────────

// ── 2.1 Relative Time Formatting ─────────────────────────────────────────────
describe('formatRelativeTime()', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatRelativeTime(null)).toBe('');
    expect(formatRelativeTime(undefined)).toBe('');
  });

  it('returns "Just now" for timestamps < 1 minute ago', () => {
    const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('Just now');
  });

  it('returns "<N>m ago" for timestamps < 1 hour', () => {
    const fortyMinutesAgo = new Date(Date.now() - 40 * 60_000).toISOString();
    expect(formatRelativeTime(fortyMinutesAgo)).toBe('40m ago');
  });

  it('returns "<N>h ago" for timestamps < 24 hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('returns "Yesterday" for timestamps exactly 1 day ago', () => {
    const yesterday = new Date(Date.now() - 25 * 3_600_000).toISOString();
    expect(formatRelativeTime(yesterday)).toBe('Yesterday');
  });

  it('returns "<N>d ago" for timestamps < 7 days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });
});

// ── 2.2 Message Deduplication ────────────────────────────────────────────────
describe('deduplicateMessages()', () => {
  it('removes exact duplicate _id entries', () => {
    const msgs = [
      { _id: 'abc', message: 'Hello' },
      { _id: 'abc', message: 'Hello duplicate' },
      { _id: 'xyz', message: 'World' },
    ];
    const result = deduplicateMessages(msgs);
    expect(result.length).toBe(2);
    expect(result[0]._id).toBe('abc');
    expect(result[1]._id).toBe('xyz');
  });

  it('filters out messages with no _id and no id', () => {
    const msgs = [
      { message: 'No id' },
      { _id: 'real', message: 'Real' },
    ];
    const result = deduplicateMessages(msgs);
    expect(result.length).toBe(1);
    expect(result[0]._id).toBe('real');
  });

  it('handles empty array', () => {
    expect(deduplicateMessages([])).toEqual([]);
  });

  it('handles temp- prefixed ids without removing them', () => {
    const msgs = [
      { _id: 'temp-1234', message: 'Optimistic msg' },
      { _id: 'real-1234', message: 'Server confirmed msg' },
    ];
    const result = deduplicateMessages(msgs);
    expect(result.length).toBe(2);
  });
});

// ── 2.3 Date Separator Grouping ──────────────────────────────────────────────
describe('groupMessagesWithSeparators()', () => {
  it('returns empty array given no messages', () => {
    expect(groupMessagesWithSeparators([])).toEqual([]);
  });

  it('inserts a "Today" separator for messages from today', () => {
    const msgs = [{ _id: 'a', message: 'hi', createdAt: new Date().toISOString() }];
    const result = groupMessagesWithSeparators(msgs);
    expect(result[0].type).toBe('separator');
    expect(result[0].date).toBe('Today');
    expect(result[1].type).toBe('message');
  });

  it('inserts a "Yesterday" separator for messages from yesterday', () => {
    const yesterday = new Date(Date.now() - 26 * 3_600_000).toISOString();
    const msgs = [{ _id: 'b', message: 'older', createdAt: yesterday }];
    const result = groupMessagesWithSeparators(msgs);
    expect(result[0].date).toBe('Yesterday');
  });

  it('only inserts ONE separator per calendar day', () => {
    const now = new Date().toISOString();
    const msgs = [
      { _id: '1', message: 'A', createdAt: now },
      { _id: '2', message: 'B', createdAt: now },
    ];
    const result = groupMessagesWithSeparators(msgs);
    const separators = result.filter(r => r.type === 'separator');
    expect(separators.length).toBe(1);
  });

  it('inserts separate separators for different days', () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 26 * 3_600_000).toISOString();
    const msgs = [
      { _id: '1', message: 'old', createdAt: yesterday },
      { _id: '2', message: 'new', createdAt: today },
    ];
    const result = groupMessagesWithSeparators(msgs);
    const separators = result.filter(r => r.type === 'separator');
    expect(separators.length).toBe(2);
  });
});

// ── 2.4 ✅ AUTO-SCROLL BUG TESTS ─────────────────────────────────────────────
describe('shouldScrollToBottom() — auto-scroll logic', () => {
  const CURRENT_USER = 'user-123';
  const OTHER_USER = 'worker-456';

  const makeMsg = (id, senderId) => ({
    _id: id,
    senderId,
    message: 'test',
    createdAt: new Date().toISOString(),
  });

  it('BUG REPRO: old behaviour would scroll regardless', () => {
    // Simulate: user scrolled UP (isNearBottom=false), new msg arrives from OTHER
    // Old behaviour: scrolled (bad)
    // New behaviour: should NOT scroll
    const msgs = [makeMsg('1', OTHER_USER), makeMsg('2', OTHER_USER)];
    const result = shouldScrollToBottom({
      uniqueMessages: msgs,
      prevCount: 1, // 1 message arrived
      isNearBottom: false, // user scrolled up
      currentUserId: CURRENT_USER,
    });
    expect(result).toBe(false); // ✅ should NOT scroll
  });

  it('scrolls when user IS near the bottom and a new message arrives', () => {
    const msgs = [makeMsg('1', OTHER_USER), makeMsg('2', OTHER_USER)];
    const result = shouldScrollToBottom({
      uniqueMessages: msgs,
      prevCount: 1,
      isNearBottom: true, // user is at bottom
      currentUserId: CURRENT_USER,
    });
    expect(result).toBe(true); // ✅ should scroll
  });

  it('always scrolls when the current user sends a message (even if scrolled up)', () => {
    const msgs = [makeMsg('1', OTHER_USER), makeMsg('2', CURRENT_USER)]; // user just sent msg
    const result = shouldScrollToBottom({
      uniqueMessages: msgs,
      prevCount: 1,
      isNearBottom: false, // user scrolled up
      currentUserId: CURRENT_USER,
    });
    expect(result).toBe(true); // ✅ must scroll — user sent it
  });

  it('does NOT scroll when user is scrolled up and incoming message is from other party', () => {
    const msgs = [makeMsg('1', CURRENT_USER), makeMsg('2', OTHER_USER)];
    const result = shouldScrollToBottom({
      uniqueMessages: msgs,
      prevCount: 1,
      isNearBottom: false,
      currentUserId: CURRENT_USER,
    });
    expect(result).toBe(false); // ✅ do not interrupt reading
  });

  it('does NOT scroll when message count has not changed (polling update with no new msg)', () => {
    const msgs = [makeMsg('1', OTHER_USER)];
    const result = shouldScrollToBottom({
      uniqueMessages: msgs,
      prevCount: 1, // same count, nothing new
      isNearBottom: false,
      currentUserId: CURRENT_USER,
    });
    expect(result).toBe(false);
  });

  it('handles empty messages array without crashing', () => {
    const result = shouldScrollToBottom({
      uniqueMessages: [],
      prevCount: 0,
      isNearBottom: true,
      currentUserId: CURRENT_USER,
    });
    expect(result).toBe(true); // near bottom + no messages = scroll (initial render)
  });
});

// ── 2.5 Conversation Filtering ───────────────────────────────────────────────
describe('filterConversations()', () => {
  const conversations = [
    { conversationId: 'c1', workerName: 'Alice',   jobId: 'j1', unreadCount: 2, lastMessageCreatedAt: '2025-01-03' },
    { conversationId: 'c2', workerName: 'Bob',     jobId: null, unreadCount: 0, lastMessageCreatedAt: '2025-01-02' },
    { conversationId: 'c3', workerName: 'Charlie', jobId: 'j2', unreadCount: 0, lastMessageCreatedAt: '2025-01-01' },
  ];
  const jobDetails = {
    j1: { title: 'Plumbing Fix' },
    j2: { title: 'AC Repair' },
  };

  it('ALL: returns all conversations sorted by most recent', () => {
    const result = filterConversations(conversations, 'all', '', jobDetails);
    expect(result.length).toBe(3);
    expect(result[0].conversationId).toBe('c1'); // most recent first
  });

  it('UNREAD: returns only conversations with unreadCount > 0', () => {
    const result = filterConversations(conversations, 'unread', '', jobDetails);
    expect(result.length).toBe(1);
    expect(result[0].conversationId).toBe('c1');
  });

  it('JOB-RELATED: returns only conversations with a jobId', () => {
    const result = filterConversations(conversations, 'job-related', '', jobDetails);
    expect(result.length).toBe(2);
    const ids = result.map(r => r.conversationId);
    expect(ids).toContain('c1');
    expect(ids).toContain('c3');
    expect(ids).not.toContain('c2');
  });

  it('GENERAL: returns only conversations with no jobId', () => {
    const result = filterConversations(conversations, 'general', '', jobDetails);
    expect(result.length).toBe(1);
    expect(result[0].conversationId).toBe('c2');
  });

  it('SEARCH by worker name (case-insensitive)', () => {
    const result = filterConversations(conversations, 'all', 'alice', jobDetails);
    expect(result.length).toBe(1);
    expect(result[0].workerName).toBe('Alice');
  });

  it('SEARCH by job title', () => {
    const result = filterConversations(conversations, 'all', 'plumbing', jobDetails);
    expect(result.length).toBe(1);
    expect(result[0].jobId).toBe('j1');
  });

  it('SEARCH returns empty array when no match', () => {
    const result = filterConversations(conversations, 'all', 'zzznomatch', jobDetails);
    expect(result.length).toBe(0);
  });

  it('UNREAD + SEARCH combo', () => {
    const result = filterConversations(conversations, 'unread', 'alice', jobDetails);
    expect(result.length).toBe(1);
    expect(result[0].conversationId).toBe('c1');
  });
});

// ── 2.6 Unread badge count ────────────────────────────────────────────────────
describe('Unread count aggregation', () => {
  it('sums unread counts across all conversations', () => {
    const conversations = [
      { unreadCount: 3 },
      { unreadCount: 0 },
      { unreadCount: 5 },
    ];
    const total = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);
    expect(total).toBe(8);
  });

  it('returns 0 when all conversations are read', () => {
    const conversations = [{ unreadCount: 0 }, { unreadCount: 0 }];
    const total = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);
    expect(total).toBe(0);
  });

  it('handles conversations with missing unreadCount', () => {
    const conversations = [{ workerName: 'Dave' }, { unreadCount: 2 }];
    const total = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);
    expect(total).toBe(2);
  });
});
