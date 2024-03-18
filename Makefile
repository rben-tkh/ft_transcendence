# Cible par défaut : docker-compose up --build
all:
	docker-compose up --build
#(while ! docker ps | grep -q "10 seconds ago" ; do sleep 1; done)
#terminator -e "watch docker ps"

clean:
	    docker-compose down --rmi all --volumes --remove-orphans

fclean: clean rm-dependencies
	    docker system prune -af --volumes
#Lancer le docker-compose
run:
	    docker-compose up

#Ouvrir un terminal dans le back:
back:
	docker exec -it ft_transcendence-backend-1 sh

#Ouvrir un terminal dans le front:
front:
	docker exec -it ft_transcendence-frontend-1 sh

# Exécuter npx prisma migrate dans le container
migrate:
	docker exec -it ft_transcendence-backend-1 sh -c "npx prisma migrate dev --name migration_$(date +%Y%m%d%H%M%S) --schema=./src/prisma/schema.prisma"

# Exécuter npx prisma generate dans le container
client:
	docker exec -it ft_transcendence-backend-1 sh -c "npx prisma generate --schema=./src/prisma/schema.prisma"

# Ouvrir Prisma Studio dans le container
studio:
	docker exec -it ft_transcendence-backend-1 sh -c "npx prisma studio --schema=./src/prisma/schema.prisma"

# Supprimer les dépendances
rm-dependencies:
	    rm -rf ./front/package-lock.json
	    rm -rf ./back/package-lock.json
	    rm -rf ./back/node_modules
	    rm -rf ./front/node_modules
	    rm -rf ./back/tsconfig.tsbuildinfo

# Supprimer les fichiers de build
rm-build:
	    sudo rm -rf ./back/dist

rm-all: fclean rm-build

# Relancer le projet
re: fclean all

# Ouvrir Terminator avec make
terminator:
	    terminator -e "make"

.PHONY: all clean fclean run back front migrate client studio rm-dependencies re terminator