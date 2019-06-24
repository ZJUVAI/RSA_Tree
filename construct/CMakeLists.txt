cmake_minimum_required(VERSION 3.6)
project(RTree)
MESSAGE(${CMAKE_SYSTEM_NAME})
MESSAGE(${CMAKE_CXX_COMPILER})
# set(CMAKE_C_COMPILER "C:/Program Files/mingw-w64/x86_64-7.1.0-posix-seh-rt_v5-rev2/mingw64/bin/gcc")
# set(CMAKE_CXX_COMPILER "C:/Program Files/mingw-w64/x86_64-7.1.0-posix-seh-rt_v5-rev2/mingw64/bin/g++")

# set(CMAKE_CXX_COMPILER "/Library/Developer/CommandLineTools/usr/bin/g++")
ADD_SUBDIRECTORY(src)