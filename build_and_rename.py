import subprocess
import os
import time
import shutil

# Fonction pour exécuter la commande npm run build
def run_npm_build():
    print("Exécution de la commande 'npm run build'...")
    process = subprocess.Popen(['npm', 'run', 'build'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # Attendre la fin de l'exécution de la commande
    stdout, stderr = process.communicate()

    if process.returncode != 0:
        print(f"Erreur lors de l'exécution de la commande : {stderr.decode()}")
    else:
        print("Commande 'npm run build' terminée avec succès.")
        return True
    return False

# Fonction pour renommer le dossier _next en next
def rename_next_folder():
    build_dir = './extension-build'
    next_folder = os.path.join(build_dir, '_next')
    renamed_folder = os.path.join(build_dir, 'next')

    # Vérifiez si le dossier _next existe et renommez-le
    if os.path.isdir(next_folder):
        print(f"Renommage de '{next_folder}' en '{renamed_folder}'...")
        shutil.move(next_folder, renamed_folder)
        print(f"Dossier renommé avec succès : {next_folder} -> {renamed_folder}")
    else:
        print(f"Le dossier {next_folder} n'a pas été trouvé dans {build_dir}")

if __name__ == '__main__':
    # Lancer la commande npm run build
    if run_npm_build():
        # Renommer le dossier _next en next après le build
        rename_next_folder()
