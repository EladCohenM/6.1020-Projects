import assert from 'node:assert';
import { Interval } from '../src/interval.ts';
import { IntervalSet, IntervalConflictError, makeIntervalSet } from '../src/intervalset.ts';
import { implementationsForTesting, RepMapIntervalSet, RepArrayIntervalSet } from '../src/intervalset-impls.ts';
import { MultiIntervalSet } from './multiintervalset.ts';
import { similarity, SimilarityCalc } from './similarity.ts';
import * as utils from '../src/utils.ts';

const notEmptySet = new RepMapIntervalSet<string>();
notEmptySet.add(10n,20n,"A");
notEmptySet.add(5n,25n,"B");




