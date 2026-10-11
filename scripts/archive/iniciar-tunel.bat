@echo off
title PetRankings - Tunel SSH Seguro Oracle Cloud
echo ======================================================================
echo  [PetRankings] Iniciando tunel SSH seguro com o PostgreSQL da Oracle
echo  Porta local: localhost:5433 -^> Oracle Cloud petrankings-vps:5432
echo  Deixe esta janela aberta enquanto cadastra produtos ou usa o Studio.
echo  Pressione Ctrl+C para encerrar quando terminar.
ssh -L 5433:127.0.0.1:5432 -N petrankings-vps
