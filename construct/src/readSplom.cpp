
#include <stdlib.h>
#include <time.h>
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <unistd.h>
#include <ctime>
#include <iostream>
#include <map>
#include <memory>
#include <ctime>
#include <cstring>
#include <nlohmann/json.hpp>
#include "RTree.h"
#include "timer.h"
#include "parse.h"
#include "Query.h"
using namespace std;

#define QUERY_QUEAL Query<1, int, 5, int, float, 10, 5, 8000, 4000, int>

typedef long long ll;


int useStorge = 0;
char jsonPath[100] = "json/splomParameter.json";
char storePath[100] = "splom";
void setParams(int argc, char ** argv) {
    int i;
    if ((i = ArgPos((char *) "-store", argc, argv)) > 0) useStorge = atoi(argv[i + 1]);

    if ((i = ArgPos((char *) "-path1", argc, argv)) > 0) strcpy(storePath, argv[i + 1]);
    if ((i = ArgPos((char *) "-path2", argc, argv)) > 0) strcpy(jsonPath, argv[i + 1]);
}


int main(int argc, char **argv) {
    setParams(argc, argv);
    
    QUERY_QUEAL query(jsonPath, argc, argv);

    if(useStorge) {
        query.load(storePath);
    } else {
        query.insert("./data/splom5_small", "./data/splom5_large");
        // query.insert("./data/splom5_small");
        query.save(storePath);
    }

    query.spolmQuery();
}
