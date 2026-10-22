// GET /user-preferences/spaced-repetition/intervals.
//
// Every list is a run of gaps, in days, between spaced-repetition reviews:
// the first is the wait after the first study, the second the wait after the
// first review, and so on — so the length is how many reviews there are.
// Which list applies to a subject: its own override if it has one, else the
// student's default, else the system's.
export interface RepetitionIntervals {
  // The student's own default for every subject; null when they never set
  // one (or cleared it), and the system's applies.
  defaultIntervals: number[] | null;
  systemIntervals: number[];
  // The most reviews (entries) a list may have.
  maxRepetitions: number;
  subjects: SubjectRepetitionIntervals[];
}

export interface SubjectRepetitionIntervals {
  subjectId: number;
  subjectName: string;
  intervals: number[];
}

// PUT body for the default and for one subject (SetRepetitionIntervalsDto).
export interface SetRepetitionIntervalsPayload {
  intervals: number[];
}
