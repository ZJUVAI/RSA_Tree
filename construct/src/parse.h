#ifndef PARSE_H_
#define PARSE_H_

#include <cstdio>
#include <iostream>
#include "SAT.h"
#include <fstream>
#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;
using std::cout; using std::endl;

int Abs(int x) {
  return x > 0 ? x : -x;
}
bool parseParameter(json& json_obj, satStruct* sat, float* minn, float* maxx, int* q){
  // section "input sat parameter" in readFilePoi.cpp
  sat->_dimCoordinate = json_obj["dimCoordinate"];
  sat->_dimInnNum = json_obj["dimInnNum"];
  *q = json_obj["queryTimes"];
  for (int i = 0; i < sat->_dimCoordinate; ++i) {
    sat->_allDomain_min[i] = json_obj["converseRange"][i][0];
    sat->_allDomain_max[i] = json_obj["converseRange"][i][1];
    minn[i] = std::stof((json_obj["originRange"][i][0]).get<std::string>());
    maxx[i] = std::stof((json_obj["originRange"][i][1]).get<std::string>());
  }

  // void read(FILE* paraStream) in SAT.h
  sat->_cooDivideNum = new int[sat->_dimCoordinate];
  sat->_cooLimitLength = new int[sat->_dimCoordinate];
  sat->_innDivideNum = new int[sat->_dimInnNum];

  for (int i = 0; i < sat -> _dimCoordinate; ++i) {
    sat->_cooLimitLength[i] = json_obj["cooLimitLength"][i];
    sat->_cooDivideNum[i] = json_obj["cooDivideNum"][i];
  }
  sat->_dimInner = 0;
  for (int i = 0; i < sat->_dimInnNum; ++i) {
      sat->_innDivideNum[i] = json_obj["innDivideNum"][i];
      sat->_dimInner += Abs(sat->_innDivideNum[i]);
  }

  sat->_useHash = json_obj["useHash"];
  sat->_useDiffernce = json_obj["useDifference"];
  sat->_useLayer = json_obj["useLayer"];
  sat->_layerMul = json_obj["layerMul"];
  sat->_useForSplit = json_obj["useForSplit"];
  return true;
}

bool parseQuery(json& json_obj, satStruct* sat, int* Ask1, int* Ask2, int* answer, int i){
  for (int j = 0; j < sat->_dimCoordinate; ++j) {
    Ask1[j] = json_obj["queryScale"][i][j*2];
    Ask2[j] = json_obj["queryScale"][i][j*2+1];
  }
  for (int j = 0; j < sat->_dimInner; ++j) {
    answer[j] = json_obj["queryAnswer"][i];
  }
  return true;
}

#endif