str=("Poi" "BrightkiteDays" "BrightkiteSecs" "BrightkiteMonths" "Flight" "YellowTaxi")
# str=("YellowTaxi")

for((z=0;z<${#str[@]};++z)) 
do 
    # ./solve"${str[z]}" -hash 0 -diff 1 > ./output/outPut"${str[z]}"01.txt
    # sleep 10s
    # ./solve"${str[z]}" -hash 1 -diff 0 > ./output/outPut"${str[z]}"10.txt
    # sleep 100s
    # ./solve"${str[z]}" -hash 1 -diff 1 > ./output/outPut"${str[z]}"11.txt
    # sleep 100s
    ./solve"${str[z]}" -hash 0 -diff 0 > ./output/outPut"${str[z]}"00.txt
    sleep 10s
done
