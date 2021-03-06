import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import styles from '../../styles/Home.module.css'
import Timer from '../../components/TimerComponent'
import CurrentSpeed from '../../components/CurrentSpeedComponent'
import GoalSpeed from '../../components/GoalSpeedComponent'
import Zone from '../../components/ZoneComponent'
import { formatSeconds, mapZoneToSpeed } from "../../utils/common"
import { API_BASE_URL } from '../../envConstants'
import { Container, Grid, Typography } from '@material-ui/core'
import { Flipper, Flipped } from 'react-flip-toolkit'
import { UpperCard } from '../../components/UpperCard'

const Workout = () => {

  const [error, setError] = useState(null)
  const [state, setState] = useState({
    currentSpeed: 0,
    goalSpeed: 0,
    currentDistance: 0,
    goalDistance: 0,
    currentTime: 0,
    currentBlockIndex: -1,
    blocks: [],
    workoutId: null,
    active: false,
    finished: false,
  })

  const handleTimerCallback = () => {
    setState(prev => ({
      ...prev,
      finished: true,
    }))
  }

  const handleActiveCallback = () => {
    let nextIndex = state.currentBlockIndex + 1;
    let nextZone = mapZoneToSpeed(state.blocks[nextIndex].intensity);
    setState(prev => ({
      ...prev,
      active: true,
      currentBlockIndex: nextIndex,
      currentTime: state.blocks[nextIndex].time,
      goalSpeed: nextZone,
    }));
  };

  const setTimerInterval = async () => {
    if (!state.active) {
      return;
    }
    if (state.currentTime - 1 >= 0) {
      setState((prev) => ({
        ...prev,
        currentTime: prev.currentTime - 1,
      }));
    } else {
      let nextIndex = state.currentBlockIndex + 1;
      if (nextIndex >= state.blocks.length) {
        console.log("reached the end of the blocks");
        setState((prev) => ({
          ...prev,
          active: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          currentTime: prev.blocks[nextIndex].time,
          currentBlockIndex: nextIndex,
          goalSpeed: mapZoneToSpeed(prev.blocks[nextIndex].intensity),
        }));
      }
    }
  };

  const setCurrentSpeedInterval = async () => {
    if (!state.active) {
      return;
    }
    fetch(`${API_BASE_URL}/bluetooth/device/read/speed`)
      .then((res) => res.json())
      .then(
        (result) => {
          setState((prev) => ({
            ...prev,
            currentSpeed: result.speed,
          }));
        },
        (error) => {
          console.error(error);
        }
      );
  };

  useEffect(() => {
    const getWorkout = async () => {
      fetch(`${API_BASE_URL}/workout/workout_id/50`)
        .then((res) => res.json())
        .then(
          (result) => {
            setState((prev) => ({
              ...prev,
              workoutId: result.workout,
              blocks: result.blocks,
            }));
          },
          (error) => {
            console.error(error);
            setError("Error connecting to server")
          }
        );
    };

    getWorkout()
  }, []);

  useEffect(() => {
    let timerInterval, speedInterval;
    if (state.workoutId && state.active) {
      timerInterval = setInterval(setTimerInterval, 1000);
      speedInterval = setInterval(setCurrentSpeedInterval, 1000);
    }
    return () => {
      clearInterval(timerInterval);
      clearInterval(speedInterval);
    };
  }, [state.workoutId, state.active]);

  if (error) {
    return (
      <Container
        maxWidth="md"
        style={{ textAlign: "center", paddingTop: "40vh" }}
      >
        <Typography>{error}</Typography>
      </Container>
    );
  }

  console.log(state.blocks)

  if (state.workoutId === null) {
    return null;
  } else {
    return (
      <Flipper flipKey={state.active}>
        <div className={styles.container}>
          <Head>
            <title>
              Workout ({formatSeconds(state.currentTime)} Remaining) |
              MySpinClass
            </title>
          </Head>
          <main className={styles.main}>
            <div className={styles.left_grid}>
              <h3>Data Grid</h3>
            </div>
            <div className={styles.grid}>
              <Grid container>
                {[
                  {
                    title: "Goal Speed",
                    label: `${state.goalSpeed || 0} mph`,
                  },
                  {
                    title: "Current Speed",
                    label: `${state.currentSpeed || 0} mph`,
                  },
                ].map((obj) => (
                  <Grid
                    item
                    xs={6}
                    alignItems="center"
                    container
                    direction="column"
                  >
                    <Flipped flipId={obj.title}>
                      <div
                        className={styles.upper_middle_top_card}
                        style={{
                          transform: `translateY(${state.active ? 0 : -200}%)`,
                        }}
                      >
                        <UpperCard
                          title={obj.title}
                          label={obj.label}
                        />
                      </div>
                    </Flipped>
                  </Grid>
                ))}
              </Grid>
              <Timer
                parentCallback={handleTimerCallback}
                activeCallback={handleActiveCallback}
                active={state.active}
                currentTime={state.currentTime}
                goalSpeed={state.goalSpeed}
                currentSpeed={state.currentSpeed}
              />
            </div>
            <div className={styles.right_grid}>
              {state.blocks.map((item, index) => (
                <Flipped flipId={`zone-${index}`} stagger>
                  <div
                    style={{
                      transform: `translateX(${state.active ? 0 : 100}%)`,
                    }}
                  >
                    <Zone
                      key={index}
                      time={item.time}
                      intensity={item.intensity}
                      id={index}
                    />
                  </div>
                </Flipped>
              ))}
            </div>
          </main>
        </div>
      </Flipper>
    );
  }
}

export default Workout;
