package com.evoting.elector.repository;

import com.evoting.elector.model.Elector;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ElectorRepository extends JpaRepository<Elector, Integer> {
}
