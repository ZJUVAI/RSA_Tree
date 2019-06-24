add_executable(solveBrightkiteDays readFileBrightkite_days.cpp)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -mcmodel=large -std=c++11 -O3 -msse -msse2 -msse3 -funroll-loops -Ofast -march=native -ffast-math -fopenmp")
SET(EXECUTABLE_OUTPUT_PATH ${PROJECT_SOURCE_DIR})