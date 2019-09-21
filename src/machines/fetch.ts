import { Machine, assign, AssignAction } from 'xstate';

// The hierarchical (recursive) schema for the states
interface FetchSchema {
  states: {
    idle: {};
    pending: {};
    fulfilled: {
      states: {
        unknown: {};
        withData: {};
        withoutData: {};
      };
    };
    rejected: {};
  };
}

// The events that the machine handles
type ResolveEvent = { type: 'RESOLVE'; results: any[] };
type RejectEvent = { type: 'REJECT'; message: string };
type FetchEvents = { type: 'FETCH' } | ResolveEvent | RejectEvent;

// The context (extended state) of the machine
interface FetchContext {
  results?: any[];
  message?: string;
}

export const fetchMachine = Machine<FetchContext, FetchSchema, FetchEvents>(
  {
    id: 'fetch',
    initial: 'idle',
    context: {},
    states: {
      idle: {
        on: { FETCH: 'pending' }
      },
      pending: {
        entry: ['fetchData'],
        on: {
          RESOLVE: { target: 'fulfilled' },
          REJECT: { target: 'rejected' }
        }
      },
      fulfilled: {
        entry: ['setResults'],
        on: {
          FETCH: 'pending'
        },
        initial: 'unknown',
        states: {
          unknown: {
            on: {
              '': [
                { target: 'withData', cond: 'hasData' },
                { target: 'withoutData' }
              ]
            }
          },
          withData: {},
          withoutData: {}
        }
      },
      rejected: {
        entry: ['setMessage'],
        on: {
          FETCH: 'pending'
        }
      }
    }
  },
  {
    actions: {
      setResults: assign((ctx, event: any) => ({
        results: event.results
      })),
      setMessage: assign((ctx, event: any) => ({
        message: event.message
      }))
    },
    guards: {
      hasData: (ctx, event) => !!ctx.results && ctx.results.length > 0
    }
  }
);