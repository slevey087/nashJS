# Snapshot report for `test/playables/stochastic.js`

The actual snapshot is saved in `stochastic.js.snap`.

Generated by [AVA](https://ava.li).

## _Stochastic constructor

> Snapshot 1

    OutcomeTree {
      map: Function {},
      tree: {
        0: [],
        1: [],
        2: [],
      },
    }

## _Stochastic play

> Snapshot 1

    {
      historyEntry: {},
      playable: _Stochastic {
        id: 's',
        next: OutcomeTree {
          map: Function {},
          tree: {
            0: [],
            1: [],
            2: [],
          },
        },
        omitHistories: false,
        playParameters: {
          history: History @Array [
            {},
            ---
            children: Set {},
            log: History @Array [
              {},
              ---
              tree: [Circular],
            ],
            scores: History @Array [
              tree: [Circular],
            ],
          ],
          information: Information {
            additional: [],
            compilers: [],
            deliver: Function {},
            getGameSummary: Function {},
            history: History @Array [
              {},
              ---
              children: Set {},
              log: History @Array [
                {},
                ---
                tree: [Circular],
              ],
              scores: History @Array [
                tree: [Circular],
              ],
            ],
            infoHistory: {
              log: [],
              scores: [],
            },
            infoPopulation: InfoPlayerList @Array [
              exclude: Function {},
              generator: Function {},
              ids: Function {},
              leader: Function {},
              onlyAlive: Function {},
              onlyAvailable: Function {},
              scores: Function {},
              scoresMean: Function {},
              scoresObject: Function {},
              scoresRange: Function {},
              scoresStd: Function {},
              strategies: Function {},
              strategyDistribution: Function {},
              usingStrategy: Function {},
            ],
            parentHistory: [],
            playable: null,
            population: Function gamePopulation {},
          },
          initializePlayers: false,
          usePayoffs: true,
          writeHistory: true,
        },
        probabilities: Probabilities @Array [
          0.1,
          0.3,
          Function valueOf {
            expression: Function {},
          },
        ],
      },
    }

## _Stochastic summarizeNext

> Snapshot 1

    {
      next: {
        0: {
          action: {
            choice: 'choice1',
            options: [
              'l',
              'r',
            ],
            player: 'player1',
          },
          probability: 0.2,
        },
        1: {
          action: {
            choice: 'choice2',
            options: [
              'u',
              'd',
            ],
            player: 'player1',
          },
          probability: Function valueOf {
            expression: Function {},
          },
        },
      },
      stochastic: 'stochastic1',
    }