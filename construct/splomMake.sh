str=("49000000" "99000000" "999000000")

for((z=0;z<${#str[@]};++z)) 
do
    for((i=1;i<=5;++i)) 
        do
            ./makeQuery -rand 40000 -num "${str[z]}" -dim "$i" -readData splomParameter"$i"_"${str[z]}".json
        done
done
