import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BitSet from "bitset";
import SelectList from "./SelectList";
import { getYearLabelsForCourseType, resolveCourseType } from "./courseUtils";

const defaultBackendUrl = process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000/api" : "";
const beReqUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || defaultBackendUrl).replace(/\/+$/, "");
const beParamSchool = "?school=";
const beParamCourse = "&course=";
const beParamYear = "&year=";
const beParamCurr = "&curr=";
const beParamClsBtm = "&classes=";
const beGetSchools = "/getschools.py";
const beGetCourses = "/getcourses.py";
const beGetCurricula = "/getcurricula.py";
const beGetClasses = "/getclasses.py";
const beGetCalendar = "/getical.py";

const mainTitle = "OrarioSync";
const schoolHeader = "Seleziona il tuo ambito di studi";
const courseHeader = "Seleziona il tuo corso di studi";
const yearHeader = "Seleziona l'anno a cui sei iscritto";
const curriculumHeader = "Seleziona il tuo curriculum";
const classesHeader = "Seleziona i corsi che segui";
const buttonContent = "Scarica orario in iCal";

const STATUS_IDLE = "idle";
const STATUS_LOADING = "loading";
const STATUS_SUCCESS = "success";
const STATUS_ERROR = "error";

const INITIAL_STAGE_STATE = {
  status: STATUS_IDLE,
  error: ""
};

function isAbortError(error) {
  if (!error) {
    return false;
  }
  if (error.name === "AbortError") {
    return true;
  }
  return typeof error.message === "string" && error.message.toLowerCase().includes("abort");
}

function toErrorMessage(error) {
  if (!error) {
    return "Errore sconosciuto";
  }
  if (typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }
  return "Richiesta non riuscita";
}

function parseClassesSelection(selectedIndexes) {
  const counts = {};
  selectedIndexes.forEach((idx) => {
    counts[idx] = counts[idx] ? counts[idx] + 1 : 1;
  });

  return selectedIndexes.filter((idx) => counts[idx] % 2 !== 0);
}

function buildClassesBitset(selectedIndexes) {
  const bitset = BitSet.fromBinaryString("0");
  selectedIndexes.forEach((idx) => bitset.flip(idx));
  return bitset;
}

function getReadableClassName(item) {
  if (typeof item === "string") {
    return item;
  }
  if (item && typeof item.name === "string") {
    return item.name;
  }
  return String(item || "");
}

function StepCard({
  title,
  subtitle,
  children,
  status,
  error,
  onRetry,
  ready,
  loadingLabel,
  className = ""
}) {
  return (
    <section className={`step-card ${ready ? "is-ready" : ""} ${className}`.trim()} aria-busy={status === STATUS_LOADING}>
      <div className="step-card__header">
        <h2>{title}</h2>
        {subtitle ? <p className="step-card__subtitle">{subtitle}</p> : null}
      </div>
      {status === STATUS_ERROR ? (
        <div className="inline-status inline-status--error" role="alert">
          <span>{error || "Impossibile caricare i dati."}</span>
          {onRetry ? (
            <button type="button" className="inline-link" onClick={onRetry}>
              Riprova
            </button>
          ) : null}
        </div>
      ) : null}
      {status === STATUS_LOADING ? <ListSkeleton label={loadingLabel} /> : null}
      <div className="step-card__content">{children}</div>
    </section>
  );
}

function ListSkeleton({ label }) {
  return (
    <div className="list-skeleton" aria-live="polite">
      <span className="sr-only">{label || "Caricamento"}</span>
      <div className="list-skeleton__row" />
      <div className="list-skeleton__row" />
      <div className="list-skeleton__row" />
      <div className="list-skeleton__row" />
    </div>
  );
}

function TopProgress({ active }) {
  return (
    <div className={`top-progress ${active ? "is-active" : ""}`} aria-hidden={!active}>
      <span className="top-progress__bar" />
    </div>
  );
}

function buildIcalUrl({ schoolIndex, courseIndex, year, curriculumIndex, classesBtm }) {
  return (
    beReqUrl +
    beGetCalendar +
    beParamSchool +
    schoolIndex +
    beParamCourse +
    courseIndex +
    beParamYear +
    year +
    beParamCurr +
    curriculumIndex +
    beParamClsBtm +
    classesBtm.toString(10)
  );
}

function OrarioSyncApp() {
  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [classes, setClasses] = useState([]);

  const [schoolIndex, setSchoolIndex] = useState(-1);
  const [courseIndex, setCourseIndex] = useState(-1);
  const [courseType, setCourseType] = useState("");
  const [year, setYear] = useState(-1);
  const [curriculumIndex, setCurriculumIndex] = useState(-1);
  const [selectedClasses, setSelectedClasses] = useState([]);

  const [schoolsStage, setSchoolsStage] = useState(INITIAL_STAGE_STATE);
  const [coursesStage, setCoursesStage] = useState(INITIAL_STAGE_STATE);
  const [curriculaStage, setCurriculaStage] = useState(INITIAL_STAGE_STATE);
  const [classesStage, setClassesStage] = useState(INITIAL_STAGE_STATE);
  const [activeRequests, setActiveRequests] = useState(0);

  const urlInputRef = useRef(null);
  const cacheRef = useRef(new Map());
  const inflightRef = useRef(new Map());
  const abortControllersRef = useRef({
    schools: null,
    courses: null,
    curricula: null,
    classes: null
  });
  const requestIdsRef = useRef({
    schools: 0,
    courses: 0,
    curricula: 0,
    classes: 0
  });

  useEffect(() => {
    return () => {
      Object.values(abortControllersRef.current).forEach((controller) => {
        if (controller) {
          controller.abort();
        }
      });
    };
  }, []);

  const trackRequest = useCallback(async (work) => {
    setActiveRequests((current) => current + 1);
    try {
      return await work();
    } finally {
      setActiveRequests((current) => Math.max(0, current - 1));
    }
  }, []);

  const fetchJsonWithCache = useCallback(
    async ({ key, url, signal }) => {
      if (cacheRef.current.has(key)) {
        return cacheRef.current.get(key);
      }

      if (inflightRef.current.has(key)) {
        return inflightRef.current.get(key);
      }

      const requestPromise = trackRequest(async () => {
        const response = await fetch(url, signal ? { signal } : undefined);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        cacheRef.current.set(key, data);
        return data;
      }).finally(() => {
        inflightRef.current.delete(key);
      });

      inflightRef.current.set(key, requestPromise);
      return requestPromise;
    },
    [trackRequest]
  );

  const createController = useCallback((stageName) => {
    const previous = abortControllersRef.current[stageName];
    if (previous) {
      previous.abort();
    }
    const next = new AbortController();
    abortControllersRef.current[stageName] = next;
    return next;
  }, []);

  const prefetchCurricula = useCallback(
    async (prefetchSchoolIndex, prefetchCourseIndex, prefetchYear) => {
      if (prefetchSchoolIndex < 0 || prefetchCourseIndex < 0 || prefetchYear <= 0) {
        return;
      }

      const key = `curricula:${prefetchSchoolIndex}:${prefetchCourseIndex}:${prefetchYear}`;
      const url =
        beReqUrl +
        beGetCurricula +
        beParamSchool +
        prefetchSchoolIndex +
        beParamCourse +
        prefetchCourseIndex +
        beParamYear +
        prefetchYear;

      try {
        await fetchJsonWithCache({ key, url });
      } catch (error) {
        if (!isAbortError(error)) {
          // Prefetch errors are intentionally silent.
        }
      }
    },
    [fetchJsonWithCache]
  );

  const prefetchClasses = useCallback(
    async (prefetchSchoolIndex, prefetchCourseIndex, prefetchYear, prefetchCurriculumIndex) => {
      if (
        prefetchSchoolIndex < 0 ||
        prefetchCourseIndex < 0 ||
        prefetchYear <= 0 ||
        prefetchCurriculumIndex < 0
      ) {
        return;
      }

      const key = `classes:${prefetchSchoolIndex}:${prefetchCourseIndex}:${prefetchYear}:${prefetchCurriculumIndex}`;
      const url =
        beReqUrl +
        beGetClasses +
        beParamSchool +
        prefetchSchoolIndex +
        beParamCourse +
        prefetchCourseIndex +
        beParamYear +
        prefetchYear +
        beParamCurr +
        prefetchCurriculumIndex;

      try {
        await fetchJsonWithCache({ key, url });
      } catch (error) {
        if (!isAbortError(error)) {
          // Prefetch errors are intentionally silent.
        }
      }
    },
    [fetchJsonWithCache]
  );

  const loadSchools = useCallback(async () => {
    const requestId = requestIdsRef.current.schools + 1;
    requestIdsRef.current.schools = requestId;

    setSchoolsStage({ status: STATUS_LOADING, error: "" });
    const controller = createController("schools");

    try {
      const data = await fetchJsonWithCache({
        key: "schools",
        url: beReqUrl + beGetSchools,
        signal: controller.signal
      });
      if (requestIdsRef.current.schools !== requestId) {
        return;
      }
      setSchools(Array.isArray(data) ? data : []);
      setSchoolsStage({ status: STATUS_SUCCESS, error: "" });
    } catch (error) {
      if (isAbortError(error) || requestIdsRef.current.schools !== requestId) {
        return;
      }
      setSchoolsStage({ status: STATUS_ERROR, error: `Impossibile caricare gli ambiti: ${toErrorMessage(error)}` });
    }
  }, [createController, fetchJsonWithCache]);

  const loadCourses = useCallback(
    async ({ nextSchoolIndex, isBackground = false }) => {
      if (nextSchoolIndex < 0) {
        return [];
      }

      const requestId = requestIdsRef.current.courses + 1;
      requestIdsRef.current.courses = requestId;
      const controller = createController("courses");
      if (!isBackground) {
        setCoursesStage({ status: STATUS_LOADING, error: "" });
      }

      const key = `courses:${nextSchoolIndex}`;
      const url = beReqUrl + beGetCourses + beParamSchool + nextSchoolIndex;

      try {
        const data = await fetchJsonWithCache({ key, url, signal: controller.signal });
        if (requestIdsRef.current.courses !== requestId) {
          return [];
        }
        setCourses(Array.isArray(data) ? data : []);
        setCoursesStage({ status: STATUS_SUCCESS, error: "" });
        return data;
      } catch (error) {
        if (isAbortError(error) || requestIdsRef.current.courses !== requestId) {
          return [];
        }
        if (!isBackground) {
          setCoursesStage({ status: STATUS_ERROR, error: `Impossibile caricare i corsi: ${toErrorMessage(error)}` });
        }
        return [];
      }
    },
    [createController, fetchJsonWithCache]
  );

  const loadCurricula = useCallback(
    async ({ nextSchoolIndex, nextCourseIndex, nextYear, isBackground = false, applyToUi = true }) => {
      if (nextSchoolIndex < 0 || nextCourseIndex < 0 || nextYear <= 0) {
        return [];
      }

      const requestId = requestIdsRef.current.curricula + 1;
      requestIdsRef.current.curricula = requestId;
      const controller = createController("curricula");
      if (!isBackground && applyToUi) {
        setCurriculaStage({ status: STATUS_LOADING, error: "" });
      }

      const key = `curricula:${nextSchoolIndex}:${nextCourseIndex}:${nextYear}`;
      const url =
        beReqUrl +
        beGetCurricula +
        beParamSchool +
        nextSchoolIndex +
        beParamCourse +
        nextCourseIndex +
        beParamYear +
        nextYear;

      try {
        const data = await fetchJsonWithCache({ key, url, signal: controller.signal });
        if (requestIdsRef.current.curricula !== requestId) {
          return data;
        }
        if (!applyToUi) {
          return data;
        }
        setCurricula(Array.isArray(data) ? data : []);
        setCurriculaStage({ status: STATUS_SUCCESS, error: "" });
        return data;
      } catch (error) {
        if (isAbortError(error) || requestIdsRef.current.curricula !== requestId) {
          return [];
        }
        if (!isBackground && applyToUi) {
          setCurriculaStage({ status: STATUS_ERROR, error: `Impossibile caricare i curricula: ${toErrorMessage(error)}` });
        }
        return [];
      }
    },
    [createController, fetchJsonWithCache]
  );

  const loadClasses = useCallback(
    async ({ nextSchoolIndex, nextCourseIndex, nextYear, nextCurriculumIndex, isBackground = false, applyToUi = true }) => {
      if (nextSchoolIndex < 0 || nextCourseIndex < 0 || nextYear <= 0 || nextCurriculumIndex < 0) {
        return [];
      }

      const requestId = requestIdsRef.current.classes + 1;
      requestIdsRef.current.classes = requestId;
      const controller = createController("classes");
      if (!isBackground && applyToUi) {
        setClassesStage({ status: STATUS_LOADING, error: "" });
      }

      const key = `classes:${nextSchoolIndex}:${nextCourseIndex}:${nextYear}:${nextCurriculumIndex}`;
      const url =
        beReqUrl +
        beGetClasses +
        beParamSchool +
        nextSchoolIndex +
        beParamCourse +
        nextCourseIndex +
        beParamYear +
        nextYear +
        beParamCurr +
        nextCurriculumIndex;

      try {
        const data = await fetchJsonWithCache({ key, url, signal: controller.signal });
        if (requestIdsRef.current.classes !== requestId) {
          return data;
        }
        if (!applyToUi) {
          return data;
        }
        setClasses(Array.isArray(data) ? data : []);
        setClassesStage({ status: STATUS_SUCCESS, error: "" });
        return data;
      } catch (error) {
        if (isAbortError(error) || requestIdsRef.current.classes !== requestId) {
          return [];
        }
        if (!isBackground && applyToUi) {
          setClassesStage({ status: STATUS_ERROR, error: `Impossibile caricare i corsi: ${toErrorMessage(error)}` });
        }
        return [];
      }
    },
    [createController, fetchJsonWithCache]
  );

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  const yearLabels = useMemo(() => getYearLabelsForCourseType(courseType), [courseType]);

  const classesBtm = useMemo(() => buildClassesBitset(selectedClasses), [selectedClasses]);

  const schoolOptions = useMemo(() => schools.map((item) => item.name), [schools]);
  const courseOptions = useMemo(() => courses.map((item) => item.name), [courses]);
  const curriculumOptions = useMemo(() => curricula.map((item) => item.name), [curricula]);
  const classOptions = useMemo(() => classes.map((item) => getReadableClassName(item)), [classes]);

  const canShowCourse = schoolIndex >= 0;
  const canShowYear = courseType.length > 0;
  const canShowCurriculum = canShowYear && year > 0;
  const canShowClasses = canShowCurriculum && curriculumIndex >= 0;

  const icalUrl = useMemo(() => {
    if (schoolIndex < 0 || courseIndex < 0 || year <= 0 || curriculumIndex < 0 || selectedClasses.length === 0) {
      return "";
    }
    return buildIcalUrl({ schoolIndex, courseIndex, year, curriculumIndex, classesBtm });
  }, [schoolIndex, courseIndex, year, curriculumIndex, selectedClasses.length, classesBtm]);

  const handleSchoolSelect = useCallback(
    async (selected) => {
      setSchoolIndex(selected);
      setCourseIndex(-1);
      setCourseType("");
      setYear(-1);
      setCurriculumIndex(-1);
      setSelectedClasses([]);

      setCourses([]);
      setCurricula([]);
      setClasses([]);
      setCoursesStage({ status: STATUS_IDLE, error: "" });
      setCurriculaStage({ status: STATUS_IDLE, error: "" });
      setClassesStage({ status: STATUS_IDLE, error: "" });

      const loadedCourses = await loadCourses({ nextSchoolIndex: selected });
      if (Array.isArray(loadedCourses) && loadedCourses.length > 0) {
        await prefetchCurricula(selected, 0, 1);
      }
    },
    [loadCourses, prefetchCurricula]
  );

  const handleCourseSelect = useCallback(
    (selected) => {
      const selectedCourse = courses[selected] || null;
      setCourseIndex(selected);
      setCourseType(resolveCourseType(selectedCourse));
      setYear(-1);
      setCurriculumIndex(-1);
      setSelectedClasses([]);
      setCurricula([]);
      setClasses([]);
      setCurriculaStage({ status: STATUS_IDLE, error: "" });
      setClassesStage({ status: STATUS_IDLE, error: "" });
    },
    [courses]
  );

  const handleYearSelect = useCallback(
    async (selected) => {
      const nextYear = selected + 1;
      setYear(nextYear);
      setCurriculumIndex(-1);
      setSelectedClasses([]);
      setCurricula([]);
      setClasses([]);
      setClassesStage({ status: STATUS_IDLE, error: "" });
      await loadCurricula({ nextSchoolIndex: schoolIndex, nextCourseIndex: courseIndex, nextYear });
    },
    [loadCurricula, schoolIndex, courseIndex]
  );

  const handleCurriculumSelect = useCallback(
    async (selected) => {
      setCurriculumIndex(selected);
      setSelectedClasses([]);
      setClasses([]);
      await loadClasses({
        nextSchoolIndex: schoolIndex,
        nextCourseIndex: courseIndex,
        nextYear: year,
        nextCurriculumIndex: selected
      });
    },
    [loadClasses, schoolIndex, courseIndex, year]
  );

  const handleClassesSelect = useCallback((selected) => {
    const normalized = parseClassesSelection(selected);
    setSelectedClasses(normalized);
  }, []);

  const handleCopyUrl = useCallback(async () => {
    if (!icalUrl) {
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(icalUrl);
        return;
      } catch (error) {
        // Fallback below.
      }
    }

    if (urlInputRef.current) {
      urlInputRef.current.select();
      document.execCommand("copy");
    }
  }, [icalUrl]);

  const firstCurriculumPrefetchedRef = useRef(new Set());
  useEffect(() => {
    if (schoolIndex < 0 || courseIndex < 0 || year <= 0 || curricula.length === 0) {
      return;
    }
    const key = `${schoolIndex}:${courseIndex}:${year}`;
    if (firstCurriculumPrefetchedRef.current.has(key)) {
      return;
    }
    firstCurriculumPrefetchedRef.current.add(key);
    prefetchClasses(schoolIndex, courseIndex, year, 0);
  }, [schoolIndex, courseIndex, year, curricula, prefetchClasses]);

  return (
    <>
      <TopProgress active={activeRequests > 0} />
      <main className="app-shell">
        <header className="hero">
          <h1>{mainTitle}</h1>
          <p>Costruisci il tuo feed iCal in pochi passaggi. I dati vengono caricati progressivamente.</p>
        </header>

        <StepCard
          title={schoolHeader}
          subtitle="Parti dall'ambito di studi."
          status={schoolsStage.status}
          error={schoolsStage.error}
          onRetry={loadSchools}
          ready={schoolsStage.status === STATUS_SUCCESS && schoolOptions.length > 0}
          loadingLabel="Caricamento ambiti"
        >
          {schoolOptions.length > 0 ? (
            <SelectList
              items={schoolOptions}
              onSelect={handleSchoolSelect}
              selected={schoolIndex}
              multiple={false}
              ariaLabel="Elenco ambiti di studio"
            />
          ) : (
            <p className="empty-message">Nessun ambito disponibile.</p>
          )}
        </StepCard>

        {canShowCourse ? (
          <StepCard
            title={courseHeader}
            subtitle="Scegli il corso."
            status={coursesStage.status}
            error={coursesStage.error}
            onRetry={() => loadCourses({ nextSchoolIndex: schoolIndex })}
            ready={courseIndex >= 0}
            loadingLabel="Caricamento corsi"
          >
            {courseOptions.length > 0 ? (
              <SelectList
                items={courseOptions}
                onSelect={handleCourseSelect}
                selected={courseIndex}
                multiple={false}
                ariaLabel="Elenco corsi di studio"
              />
            ) : coursesStage.status !== STATUS_LOADING ? (
              <p className="empty-message">Nessun corso trovato per questo ambito.</p>
            ) : null}
          </StepCard>
        ) : null}

        {canShowYear ? (
          <StepCard
            title={yearHeader}
            subtitle="Seleziona l'anno corrente."
            status={STATUS_SUCCESS}
            ready={year > 0}
            loadingLabel=""
          >
            <SelectList
              items={yearLabels}
              onSelect={handleYearSelect}
              selected={year - 1}
              multiple={false}
              ariaLabel="Anno di iscrizione"
            />
          </StepCard>
        ) : null}

        {canShowCurriculum ? (
          <StepCard
            title={curriculumHeader}
            subtitle="I curricula disponibili dipendono dal corso e dall'anno."
            status={curriculaStage.status}
            error={curriculaStage.error}
            onRetry={() =>
              loadCurricula({
                nextSchoolIndex: schoolIndex,
                nextCourseIndex: courseIndex,
                nextYear: year
              })
            }
            ready={curriculumIndex >= 0}
            loadingLabel="Caricamento curricula"
          >
            {curriculumOptions.length > 0 ? (
              <SelectList
                items={curriculumOptions}
                onSelect={handleCurriculumSelect}
                selected={curriculumIndex}
                multiple={false}
                ariaLabel="Elenco curricula"
              />
            ) : curriculaStage.status !== STATUS_LOADING ? (
              <p className="empty-message">Nessun curriculum disponibile per questa combinazione.</p>
            ) : null}
          </StepCard>
        ) : null}

        {canShowClasses ? (
          <StepCard
            title={classesHeader}
            subtitle="Selezione multipla supportata."
            status={classesStage.status}
            error={classesStage.error}
            onRetry={() =>
              loadClasses({
                nextSchoolIndex: schoolIndex,
                nextCourseIndex: courseIndex,
                nextYear: year,
                nextCurriculumIndex: curriculumIndex
              })
            }
            ready={selectedClasses.length > 0}
            loadingLabel="Caricamento corsi"
          >
            {classOptions.length > 0 ? (
              <SelectList
                items={classOptions}
                multiple={true}
                onSelect={handleClassesSelect}
                selected={selectedClasses}
                ariaLabel="Elenco corsi"
              />
            ) : classesStage.status !== STATUS_LOADING ? (
              <p className="empty-message">Nessun corso trovato per il curriculum selezionato.</p>
            ) : null}
          </StepCard>
        ) : null}

        {icalUrl ? (
          <section className="download-card">
            <p>Sincronizza il calendario al seguente indirizzo per avere l'orario sempre aggiornato.</p>
            <div className="download-card__url-row">
              <input ref={urlInputRef} className="download-card__url" type="text" readOnly value={icalUrl} />
              <button type="button" className="secondary-btn" onClick={handleCopyUrl}>
                Copia URL
              </button>
            </div>
            <div className="download-card__cta">
              <button type="button" onClick={() => window.open(icalUrl)}>
                {buttonContent}
              </button>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}

export default OrarioSyncApp;
